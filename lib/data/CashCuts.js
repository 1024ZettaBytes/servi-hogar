import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { CashCut } from '../models/CashCut';
import { CashExpense } from '../models/CashExpense';
import { Payment } from '../models/Payment';
import { SalePayment } from '../models/SalePayment';
import { PaymentAccount } from '../models/PaymentAccount';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { uploadFile } from '../cloud';
import { getFileExtension } from '../client/utils';
import {Sale} from '../models/Sale';
import {
  ROUTE_CASH_METHOD,
  OFFICE_CASH_METHOD,
  OFFICE_CASH_ROLES,
  CASH_EXPENSE_CONCEPTS,
  CASH_CUT_START_DATE
} from '../consts/OBJ_CONTS';
Sale.init();
PaymentAccount.init();
User.init();

const internalError = (message) => {
  const error = new Error(message);
  error.name = 'Internal';
  return error;
};

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * ObjectId mínimo para una fecha. El _id de Mongo lleva embebido el timestamp
 * de creación del documento, así que sirve para acotar por fecha de captura
 * sin agregar campos ni migrar los registros que ya existen.
 */
const objectIdFromDate = (date) =>
  mongoose.Types.ObjectId.createFromTime(Math.floor(date.getTime() / 1000));

/**
 * Cobros en efectivo que todavía no entran en ningún corte.
 *
 * El método de pago es lo que decide a qué corte pertenece el dinero, no el
 * rol de quien lo capturó: CASH es efectivo que trae el personal de ruta y
 * CASH_OFFICE es efectivo que ya está en la caja de la oficina.
 *
 * `userId` solo se usa en el corte de ruta, donde cada quien responde por lo
 * que cobró. La caja de oficina es una sola, así que no se filtra por persona.
 */
async function findOpenCashPayments({ method, userId }) {
  const paymentFilter = {
    method,
    cashCut: null,
    // Se ancla en cuándo se capturó el cobro, no en `date`: esa es una fecha
    // de negocio que el usuario puede poner hacia atrás, mientras que el
    // efectivo entra al cajón en el momento de la captura.
    _id: { $gte: objectIdFromDate(CASH_CUT_START_DATE) }
  };
  const salePaymentFilter = {
    method,
    cashCut: null,
    // `createdAt` siempre se guarda con la hora de captura, nunca se retrocede.
    createdAt: { $gte: CASH_CUT_START_DATE }
  };

  if (userId) {
    paymentFilter.lastUpdatedBy = userId;
    salePaymentFilter.createdBy = userId;
  }

  const [payments, salePayments] = await Promise.all([
    Payment.find(paymentFilter)
      .select('number amount reason description method date lastUpdatedBy')
      .populate('lastUpdatedBy', 'name')
      .sort({ date: 1 })
      .lean(),
    SalePayment.find(salePaymentFilter)
      .select('amount paymentDate createdAt sale createdBy method')
      .populate({ path: 'sale', select: 'saleNum' })
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 })
      .lean()
  ]);

  return { payments, salePayments };
}

const sumAmounts = (list) =>
  round2(list.reduce((total, item) => total + (item.amount || 0), 0));

/**
 * Normaliza los cobros a un desglose legible para la UI.
 */
function buildBreakdown({ payments, salePayments }) {
  const fromPayments = payments.map((payment) => ({
    _id: payment._id,
    source: payment.reason === 'EXTERNAL_REPAIR' ? 'REPARACION_EXTERNA' : 'RENTA',
    reference: payment.number ? `Pago #${payment.number}` : 'Pago',
    description: payment.description || '',
    method: payment.method,
    amount: round2(payment.amount),
    // Se muestra la hora de captura, que es cuando entró el efectivo, y no
    // `date`, que puede venir con fecha anterior si se capturó retroactivo.
    date: payment._id.getTimestamp(),
    paymentDate: payment.date,
    collectedBy: payment.lastUpdatedBy?.name || null
  }));

  const fromSalePayments = salePayments.map((payment) => ({
    _id: payment._id,
    source: 'VENTA',
    reference: payment.sale?.saleNum
      ? `Venta #${payment.sale.saleNum}`
      : 'Abono de venta',
    description: 'Abono de crédito',
    method: payment.method,
    amount: round2(payment.amount),
    date: payment.createdAt || payment.paymentDate,
    collectedBy: payment.createdBy?.name || null
  }));

  return [...fromPayments, ...fromSalePayments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

async function getNextCutNumber(session) {
  const query = CashCut.findOne().sort({ cutNumber: -1 }).select('cutNumber');
  const last = session ? await query.session(session).lean() : await query.lean();
  return last ? last.cutNumber + 1 : 1;
}

/**
 * Resumen del efectivo pendiente de cortar de una persona de ruta.
 */
export async function getRouteCashSummaryData(userId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const open = await findOpenCashPayments({
    method: ROUTE_CASH_METHOD,
    userId
  });
  const breakdown = buildBreakdown(open);
  const total = round2(
    sumAmounts(open.payments) + sumAmounts(open.salePayments)
  );

  const lastCut = await CashCut.findOne({ type: 'RUTA', user: userId })
    .sort({ periodEnd: -1 })
    .select('cutNumber periodEnd status systemAmount declaredAmount')
    .lean();

  const pendingDeposits = await CashCut.find({
    type: 'RUTA',
    user: userId,
    status: 'PENDIENTE_DEPOSITO'
  })
    .sort({ periodEnd: -1 })
    .lean();

  return {
    total,
    count: breakdown.length,
    breakdown,
    periodStart: lastCut?.periodEnd || null,
    lastCut: lastCut || null,
    pendingDeposits
  };
}

/**
 * Estado de la caja de oficina. El saldo se ancla en el último corte (lo
 * contado por quien recibió, o lo declarado si aún no se confirma) y sobre ese
 * ancla se suman los cobros y se restan los gastos que siguen abiertos.
 */
export async function getOfficeBoxStatusData() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const open = await findOpenCashPayments({ method: OFFICE_CASH_METHOD });
  const breakdown = buildBreakdown(open);
  const cashIn = round2(
    sumAmounts(open.payments) + sumAmounts(open.salePayments)
  );

  const openExpenses = await CashExpense.find({ cashCut: null })
    .populate('createdBy', 'name')
    .sort({ date: 1 })
    .lean();
  const expensesTotal = sumAmounts(openExpenses);

  const lastCut = await CashCut.findOne({ type: 'OFICINA' })
    .sort({ periodEnd: -1 })
    .populate('user', 'name')
    .populate('handedToUser', 'name')
    .lean();

  // Si el corte anterior ya fue contado por quien lo recibió, ese conteo manda.
  const previousBalance = lastCut
    ? round2(
        lastCut.confirmedAmount !== null &&
          lastCut.confirmedAmount !== undefined
          ? lastCut.confirmedAmount
          : lastCut.declaredAmount
      )
    : 0;

  const expectedBalance = round2(previousBalance + cashIn - expensesTotal);

  return {
    previousBalance,
    cashIn,
    expensesTotal,
    expectedBalance,
    breakdown,
    expenses: openExpenses,
    lastCut: lastCut || null,
    periodStart: lastCut?.periodEnd || null,
    // Corte entregado que todavía nadie ha contado
    pendingConfirmation:
      lastCut && lastCut.status === 'PENDIENTE_CONFIRMACION' ? lastCut : null
  };
}

/**
 * Cierra el corte de ruta de una persona: marca sus cobros en efectivo como
 * cortados y deja el corte pendiente de depósito.
 */
export async function createRouteCashCutData({
  userId,
  declaredAmount,
  notes,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  const declared = round2(declaredAmount);

  if (!Number.isFinite(declared) || declared < 0) {
    throw internalError('Indique el monto que está entregando.');
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const open = await findOpenCashPayments({
      method: ROUTE_CASH_METHOD,
      userId
    });
    const systemAmount = round2(
      sumAmounts(open.payments) + sumAmounts(open.salePayments)
    );

    if (!open.payments.length && !open.salePayments.length) {
      throw internalError('No tiene efectivo pendiente de cortar.');
    }

    const lastCut = await CashCut.findOne({ type: 'RUTA', user: userId })
      .sort({ periodEnd: -1 })
      .select('periodEnd')
      .session(session)
      .lean();

    const cut = new CashCut({
      cutNumber: await getNextCutNumber(session),
      type: 'RUTA',
      user: userId,
      periodStart: lastCut?.periodEnd || null,
      periodEnd: currentDate,
      previousBalance: 0,
      cashIn: systemAmount,
      expensesTotal: 0,
      systemAmount,
      declaredAmount: declared,
      difference: round2(declared - systemAmount),
      status: 'PENDIENTE_DEPOSITO',
      notes: notes || '',
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy
    });
    await cut.save({ session, isNew: true });

    await markPaymentsAsCut(open, cut._id, session);

    await session.commitTransaction();
    await session.endSession();

    return { cutId: cut._id, cutNumber: cut.cutNumber, systemAmount };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    throw new Error('Ocurrió un error al generar el corte. Intente de nuevo.');
  }
}

async function markPaymentsAsCut(open, cutId, session) {
  const paymentIds = open.payments.map((payment) => payment._id);
  const salePaymentIds = open.salePayments.map((payment) => payment._id);

  await Promise.all([
    paymentIds.length
      ? Payment.updateMany(
          { _id: { $in: paymentIds } },
          { $set: { cashCut: cutId } },
          { session }
        )
      : Promise.resolve(),
    salePaymentIds.length
      ? SalePayment.updateMany(
          { _id: { $in: salePaymentIds } },
          { $set: { cashCut: cutId } },
          { session }
        )
      : Promise.resolve()
  ]);
}

/**
 * Sube el comprobante del depósito de un corte de ruta.
 */
export async function registerCashCutDepositData({
  cutId,
  userId,
  userRole,
  depositAccountId,
  depositAmount,
  depositFolio,
  receiptFile,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  const amount = round2(depositAmount);

  if (!receiptFile) {
    throw internalError('Suba el comprobante de su depósito.');
  }
  if (!depositAccountId) {
    throw internalError('Indique la cuenta a la que depositó.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw internalError('Indique el monto depositado.');
  }

  if (!isConnected()) {
    await connectToDatabase();
  }

  const cut = await CashCut.findById(cutId);
  if (!cut) {
    throw internalError('El corte no existe.');
  }
  if (cut.type !== 'RUTA') {
    throw internalError('Este corte no requiere depósito.');
  }
  if (cut.status === 'DEPOSITADO') {
    throw internalError('Este corte ya fue depositado.');
  }
  if (userRole !== 'ADMIN' && cut.user.toString() !== userId.toString()) {
    throw internalError('Solo puede depositar sus propios cortes.');
  }

  // La subida va fuera de transacción para no sostenerla durante la red.
  const receiptUrl = await uploadFile(
    receiptFile.filepath,
    `cash-cuts/deposit_${cut.cutNumber}_${currentDate.getTime()}.${getFileExtension(
      receiptFile.originalFilename
    )}`
  );

  cut.depositAccount = depositAccountId;
  cut.depositAmount = amount;
  cut.depositFolio = depositFolio || null;
  cut.depositReceiptUrl = receiptUrl;
  cut.depositedAt = currentDate;
  cut.status = 'DEPOSITADO';
  cut.updatedAt = currentDate;
  cut.lastUpdatedBy = lastUpdatedBy;

  await cut.save({ isNew: false });

  return { success: true };
}

/**
 * Cierra el turno de oficina: fija el total físico declarado en caja, cierra
 * los cobros y gastos abiertos, y lo deja pendiente de que la persona que
 * entra lo cuente y confirme.
 */
export async function createOfficeCashCutData({
  userId,
  declaredAmount,
  handedToUserId,
  notes,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  const declared = round2(declaredAmount);

  if (!Number.isFinite(declared) || declared < 0) {
    throw internalError('Indique el total que hay en caja.');
  }

  if (handedToUserId && handedToUserId.toString() === userId.toString()) {
    throw internalError('No puede entregarse la caja a usted misma.');
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const status = await getOfficeBoxStatusData();

    if (status.pendingConfirmation) {
      throw internalError(
        'Hay un corte anterior sin confirmar. Debe contarse y confirmarse antes de cerrar otro turno.'
      );
    }

    const open = await findOpenCashPayments({ method: OFFICE_CASH_METHOD });
    const openExpenses = await CashExpense.find({ cashCut: null })
      .select('_id amount')
      .session(session)
      .lean();

    const cut = new CashCut({
      cutNumber: await getNextCutNumber(session),
      type: 'OFICINA',
      user: userId,
      periodStart: status.periodStart,
      periodEnd: currentDate,
      previousBalance: status.previousBalance,
      cashIn: status.cashIn,
      expensesTotal: status.expensesTotal,
      systemAmount: status.expectedBalance,
      declaredAmount: declared,
      difference: round2(declared - status.expectedBalance),
      status: 'PENDIENTE_CONFIRMACION',
      handedToUser: handedToUserId || null,
      notes: notes || '',
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy
    });
    await cut.save({ session, isNew: true });

    await markPaymentsAsCut(open, cut._id, session);

    if (openExpenses.length) {
      await CashExpense.updateMany(
        { _id: { $in: openExpenses.map((expense) => expense._id) } },
        { $set: { cashCut: cut._id } },
        { session }
      );
    }

    await session.commitTransaction();
    await session.endSession();

    return {
      cutId: cut._id,
      cutNumber: cut.cutNumber,
      systemAmount: status.expectedBalance
    };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    throw new Error('Ocurrió un error al cerrar el turno. Intente de nuevo.');
  }
}

/**
 * La persona que entra cuenta el efectivo y confirma de recibido. Su conteo
 * pasa a ser el saldo con el que abre la caja.
 */
export async function confirmOfficeCashCutData({
  cutId,
  userId,
  userRole,
  confirmedAmount,
  notes,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  const counted = round2(confirmedAmount);

  if (!Number.isFinite(counted) || counted < 0) {
    throw internalError('Indique el monto que contó.');
  }

  if (!isConnected()) {
    await connectToDatabase();
  }

  const cut = await CashCut.findById(cutId);
  if (!cut) {
    throw internalError('El corte no existe.');
  }
  if (cut.type !== 'OFICINA') {
    throw internalError('Este corte no se confirma.');
  }
  if (cut.status === 'CONFIRMADO') {
    throw internalError('Este corte ya fue confirmado.');
  }
  if (cut.user.toString() === userId.toString()) {
    throw internalError('El corte lo debe confirmar quien recibe la caja.');
  }
  // Si se designó a alguien, solo esa persona (o un admin) puede confirmar.
  if (
    userRole !== 'ADMIN' &&
    cut.handedToUser &&
    cut.handedToUser.toString() !== userId.toString()
  ) {
    throw internalError('La caja fue entregada a otra persona.');
  }

  cut.confirmedAmount = counted;
  cut.confirmedAt = currentDate;
  cut.confirmedBy = userId;
  cut.status = 'CONFIRMADO';
  if (notes) {
    cut.notes = cut.notes ? `${cut.notes}\n${notes}` : notes;
  }
  cut.updatedAt = currentDate;
  cut.lastUpdatedBy = lastUpdatedBy;

  await cut.save({ isNew: false });

  return { success: true, confirmedAmount: counted };
}

/**
 * Corrección administrativa de un monto de un corte. Nunca se sobrescribe en
 * silencio: cada cambio queda en `edits`.
 */
export async function editCashCutAmountData({
  cutId,
  field,
  newValue,
  reason,
  lastUpdatedBy
}) {
  const editableFields = ['declaredAmount', 'confirmedAmount', 'depositAmount'];

  if (!editableFields.includes(field)) {
    throw internalError('El campo indicado no se puede corregir.');
  }

  const value = round2(newValue);
  if (!Number.isFinite(value) || value < 0) {
    throw internalError('Indique un monto válido.');
  }

  if (!isConnected()) {
    await connectToDatabase();
  }

  const cut = await CashCut.findById(cutId);
  if (!cut) {
    throw internalError('El corte no existe.');
  }

  const currentDate = new Date();
  const previousValue = cut[field] ?? null;

  cut[field] = value;

  // La diferencia siempre se recalcula contra lo que el sistema esperaba.
  if (field === 'declaredAmount') {
    cut.difference = round2(value - cut.systemAmount);
  }

  cut.edits.push({
    field,
    previousValue,
    newValue: value,
    reason: reason || '',
    editedBy: lastUpdatedBy,
    editedAt: currentDate
  });
  cut.updatedAt = currentDate;
  cut.lastUpdatedBy = lastUpdatedBy;

  await cut.save({ isNew: false });

  return { success: true };
}

export async function getCashCutsData({
  page = 1,
  limit = 20,
  type = null,
  status = null,
  userId = null
} = {}) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (userId) filter.user = userId;

  const skip = (page - 1) * limit;

  const [list, total] = await Promise.all([
    CashCut.find(filter)
      .populate('user', 'name')
      .populate('handedToUser', 'name')
      .populate('confirmedBy', 'name')
      .populate('depositAccount', 'bank number')
      .populate('edits.editedBy', 'name')
      .sort({ periodEnd: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CashCut.countDocuments(filter)
  ]);

  return { list, total };
}

/**
 * Detalle de un corte con los cobros y gastos que cerró.
 */
export async function getCashCutDetailData(cutId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const cut = await CashCut.findById(cutId)
    .populate('user', 'name')
    .populate('handedToUser', 'name')
    .populate('confirmedBy', 'name')
    .populate('depositAccount', 'bank number')
    .populate('edits.editedBy', 'name')
    .lean();

  if (!cut) {
    throw internalError('El corte no existe.');
  }

  const [payments, salePayments, expenses] = await Promise.all([
    Payment.find({ cashCut: cutId })
      .select('number amount reason description method date lastUpdatedBy')
      .populate('lastUpdatedBy', 'name')
      .lean(),
    SalePayment.find({ cashCut: cutId })
      .select('amount paymentDate createdAt sale method createdBy')
      .populate({ path: 'sale', select: 'saleNum' })
      .populate('createdBy', 'name')
      .lean(),
    CashExpense.find({ cashCut: cutId })
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .lean()
  ]);

  return {
    cut,
    breakdown: buildBreakdown({ payments, salePayments }),
    expenses
  };
}

/**
 * Registra un gasto o compra pagada de la caja de oficina. El recibo es
 * obligatorio.
 */
export async function createCashExpenseData({
  concept,
  description,
  amount,
  date,
  receiptFile,
  createdBy
}) {
  const currentDate = new Date();
  const expenseAmount = round2(amount);

  if (!CASH_EXPENSE_CONCEPTS[concept]) {
    throw internalError('Indique un concepto válido.');
  }
  if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
    throw internalError('Indique un monto válido.');
  }
  if (!receiptFile) {
    throw internalError('El recibo del gasto es obligatorio.');
  }

  if (!isConnected()) {
    await connectToDatabase();
  }

  const box = await getOfficeBoxStatusData();
  if (expenseAmount > box.expectedBalance) {
    throw internalError(
      `No hay suficiente efectivo en caja. Disponible: $${box.expectedBalance}`
    );
  }

  const receiptUrl = await uploadFile(
    receiptFile.filepath,
    `cash-expenses/expense_${currentDate.getTime()}.${getFileExtension(
      receiptFile.originalFilename
    )}`
  );

  const last = await CashExpense.findOne()
    .sort({ expenseNumber: -1 })
    .select('expenseNumber')
    .lean();

  const expense = new CashExpense({
    expenseNumber: last ? last.expenseNumber + 1 : 1,
    concept,
    description: description || '',
    amount: expenseAmount,
    receiptUrl,
    date: date ? new Date(date) : currentDate,
    createdBy,
    createdAt: currentDate,
    updatedAt: currentDate,
    lastUpdatedBy: createdBy
  });

  await expense.save({ isNew: true });

  return { expenseId: expense._id, expenseNumber: expense.expenseNumber };
}

export async function getCashExpensesData({
  page = 1,
  limit = 20,
  onlyOpen = false
} = {}) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const filter = onlyOpen ? { cashCut: null } : {};
  const skip = (page - 1) * limit;

  const [list, total] = await Promise.all([
    CashExpense.find(filter)
      .populate('createdBy', 'name')
      .populate('edits.editedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CashExpense.countDocuments(filter)
  ]);

  return { list, total };
}

/**
 * Corrección administrativa del monto de un gasto, con bitácora.
 */
export async function editCashExpenseData({
  expenseId,
  newValue,
  reason,
  lastUpdatedBy
}) {
  const value = round2(newValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw internalError('Indique un monto válido.');
  }

  if (!isConnected()) {
    await connectToDatabase();
  }

  const expense = await CashExpense.findById(expenseId);
  if (!expense) {
    throw internalError('El gasto no existe.');
  }

  const currentDate = new Date();

  expense.edits.push({
    field: 'amount',
    previousValue: expense.amount,
    newValue: value,
    reason: reason || '',
    editedBy: lastUpdatedBy,
    editedAt: currentDate
  });
  expense.amount = value;
  expense.updatedAt = currentDate;
  expense.lastUpdatedBy = lastUpdatedBy;

  await expense.save({ isNew: false });

  return { success: true };
}

/**
 * Personas de oficina a las que se les puede entregar la caja.
 */
export async function getOfficeCashUsersData(excludeUserId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const roles = await Role.find({ id: { $in: OFFICE_CASH_ROLES } })
    .select('_id')
    .lean();

  const users = await User.find({
    role: { $in: roles.map((role) => role._id) },
    isActive: true,
    _id: { $ne: excludeUserId }
  })
    .select('name')
    .sort({ name: 1 })
    .lean();

  return users;
}
