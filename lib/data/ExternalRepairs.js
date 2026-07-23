import { connectToDatabase, isConnected } from '../db';
import { User } from '../models/User';
import { Role } from '../models/Role';
import {
  ExternalRepair,
  EXTERNAL_REPAIR_STATUS
} from '../models/ExternalRepair';
import { UsedInventory } from '../models/UsedInventory';
import { Inventory } from '../models/Inventory';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { Payment } from '../models/Payment';
import { PAYMENT_REASONS, PAYMENT_METHODS } from '../consts/OBJ_CONTS';
import { getFileExtension } from '../client/utils';
import { uploadFile } from '../cloud';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Statuses in which the repair still counts as "assigned" to its technician,
// used for load-balancing the automatic assignment.
const OPEN_STATUSES = [
  EXTERNAL_REPAIR_STATUS.POR_EVALUAR,
  EXTERNAL_REPAIR_STATUS.ESPERANDO_AUTORIZACION,
  EXTERNAL_REPAIR_STATUS.AUTORIZADA,
  EXTERNAL_REPAIR_STATUS.REPARADA
];

const TERMINAL_STATUSES = [
  EXTERNAL_REPAIR_STATUS.ENTREGADA,
  EXTERNAL_REPAIR_STATUS.DEVUELTA,
  EXTERNAL_REPAIR_STATUS.CANCELADA
];

export const getNextExternalRepairId = async () => {
  const last = await ExternalRepair.findOne(
    {},
    {},
    { sort: { totalNumber: -1 } }
  );
  if (last && last.totalNumber && last.totalNumber > 0) {
    return last.totalNumber + 1;
  }
  return 1;
};

// Pick the active technician with the fewest open external repairs (a tech with
// none wins). Deterministic tie-break by user creation order.
async function pickLeastLoadedTechnician(session) {
  const tecRole = await Role.findOne({ id: 'TEC' });
  if (!tecRole) return null;
  const technicians = await User.find({ role: tecRole._id, isActive: true })
    .sort({ createdAt: 1, _id: 1 })
    .session(session);
  if (technicians.length === 0) return null;

  const counts = await ExternalRepair.aggregate([
    { $match: { status: { $in: OPEN_STATUSES }, takenBy: { $ne: null } } },
    { $group: { _id: '$takenBy', count: { $sum: 1 } } }
  ]).session(session);
  const countByTech = new Map(
    counts.map((c) => [c._id.toString(), c.count])
  );

  let best = null;
  let bestCount = Infinity;
  for (const tech of technicians) {
    const c = countByTech.get(tech._id.toString()) || 0;
    if (c < bestCount) {
      best = tech;
      bestCount = c;
    }
  }
  return best;
}

// Office schedules the pickup (recolección). Captures the customer + fault and
// assigns a route operator + date. Photos and the machine's condition note are
// captured later by the operator at pickup. No technician yet.
export async function createExternalRepairData({
  customerId,
  customerName,
  customerCell,
  customerAddress,
  customerMaps,
  failureDescription,
  pickupAssignedTo,
  pickupScheduledDate,
  createdBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  if (!isConnected()) {
    await connectToDatabase();
  }
  if (!customerId) {
    error.message = 'Seleccione un cliente.';
    throw error;
  }
  if (!failureDescription) {
    error.message = 'Indique la falla reportada de la lavadora.';
    throw error;
  }
  if (!pickupAssignedTo || !pickupScheduledDate) {
    error.message = 'Indique el chofer y la fecha de recolección.';
    throw error;
  }
  const customer = await Customer.findById(customerId).lean();
  if (!customer) {
    error.message = 'El cliente seleccionado no es válido.';
    throw error;
  }
  const opeRole = await Role.findOne({ id: 'OPE' });
  const operator = await User.findOne({
    _id: pickupAssignedTo,
    role: opeRole?._id,
    isActive: true
  });
  if (!operator) {
    error.message = 'Chofer (operador) no válido o inactivo.';
    throw error;
  }

  const totalNumber = await getNextExternalRepairId();
  const newRepair = await new ExternalRepair({
    totalNumber,
    customer: customer._id,
    // Confirmed snapshot at scheduling time (falls back to the customer record).
    customerName: customerName || customer.name,
    customerCell: customerCell || customer.cell || '',
    customerAddress: customerAddress || '',
    customerMaps: customerMaps || '',
    failureDescription,
    status: EXTERNAL_REPAIR_STATUS.RECOLECCION_AGENDADA,
    pickupAssignedTo: operator._id,
    pickupScheduledDate: new Date(pickupScheduledDate),
    createdAt: currentDate,
    updatedAt: currentDate,
    createdBy,
    lastUpdatedBy: createdBy
  }).save({ new: true });
  return newRepair;
}

// Office cancels a scheduled pickup (e.g. the client changed their mind). Only
// allowed before the machine is collected — nothing physical has happened yet.
export async function cancelExternalRepairData({
  repairId,
  cancellationReason,
  lastUpdatedBy
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  if (!cancellationReason || !cancellationReason.trim()) {
    error.message = 'Indique el motivo de la cancelación.';
    throw error;
  }
  const repair = await ExternalRepair.findById(repairId);
  if (!repair) {
    error.message = 'No se encontró la recolección indicada.';
    throw error;
  }
  if (repair.status !== EXTERNAL_REPAIR_STATUS.RECOLECCION_AGENDADA) {
    error.message =
      'Solo se puede cancelar una recolección que aún no se ha realizado.';
    throw error;
  }
  const currentDate = Date.now();
  repair.status = EXTERNAL_REPAIR_STATUS.CANCELADA;
  repair.cancellationReason = cancellationReason.trim();
  repair.updatedAt = currentDate;
  repair.lastUpdatedBy = lastUpdatedBy;
  await repair.save({ new: false });
  return repair;
}

// Route operator completes the pickup: captures the 4 photos + a condition note,
// and the machine moves onto the operator's vehicle.
export async function completeExternalRepairPickupData({
  repairId,
  operatorId,
  brand,
  serialNumber,
  files,
  conditionNote,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const repair = await ExternalRepair.findById(repairId);
    if (!repair) {
      error.message = 'No se encontró la recolección indicada.';
      throw error;
    }
    if (repair.status !== EXTERNAL_REPAIR_STATUS.RECOLECCION_AGENDADA) {
      error.message = 'La recolección no está agendada.';
      throw error;
    }
    if (!brand || !brand.trim()) {
      error.message = 'Indique la marca de la lavadora.';
      throw error;
    }

    const photoFields = ['photo1', 'photo2', 'photo3', 'photo4'];
    if (photoFields.some((field) => !files?.[field])) {
      error.message = 'Debe subir las 4 fotos obligatorias de la lavadora.';
      throw error;
    }

    const vehicle = await Vehicle.findOne({ operator: operatorId });
    if (!vehicle) {
      error.message = 'El chofer no tiene un vehículo asignado.';
      throw error;
    }

    // Upload the entry photos in parallel before the transaction.
    const entryPhotos = await Promise.all(
      photoFields.map((field) =>
        uploadFile(
          files[field].filepath,
          `external_repair_${field}_${new Date().getTime()}.${getFileExtension(
            files[field].originalFilename
          )}`
        )
      )
    );

    await session.startTransaction();
    repair.brand = brand.trim();
    repair.serialNumber = (serialNumber || '').trim();
    repair.entryPhotos = entryPhotos;
    repair.pickupConditionNote = conditionNote || '';
    repair.pickupCompletedAt = currentDate;
    repair.status = EXTERNAL_REPAIR_STATUS.RECOLECTADA;
    repair.currentVehicle = vehicle._id;
    repair.currentWarehouse = null;
    repair.updatedAt = currentDate;
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
    return repair;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al completar la recolección. Intente de nuevo.'
      );
    }
  }
}

// "Bajar en bodega": receive the collected machine into a warehouse. This starts
// the quotation stage — the technician is auto-assigned and the 24h budget SLA begins.
export async function receiveExternalRepairInWarehouseData({
  repairId,
  warehouseId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const repair = await ExternalRepair.findById(repairId);
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    if (repair.status !== EXTERNAL_REPAIR_STATUS.RECOLECTADA) {
      error.message = 'El equipo no está recolectado.';
      throw error;
    }
    if (!warehouseId) {
      error.message = 'Indique la bodega de recepción.';
      throw error;
    }

    await session.startTransaction();
    const technician = await pickLeastLoadedTechnician(session);
    if (!technician) {
      error.message =
        'No hay técnicos activos para asignar la reparación externa.';
      throw error;
    }
    repair.status = EXTERNAL_REPAIR_STATUS.POR_EVALUAR;
    repair.currentWarehouse = warehouseId;
    repair.currentVehicle = null;
    repair.warehouseReceivedAt = currentDate;
    repair.takenBy = technician._id;
    repair.takenAt = currentDate;
    // Technician has 24h to submit the budget.
    repair.budgetDeadline = new Date(currentDate + 24 * HOUR_MS);
    repair.updatedAt = currentDate;
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
    return repair;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al recibir el equipo en bodega. Intente de nuevo.'
      );
    }
  }
}

// Machines currently collected and on a vehicle (awaiting drop-off at a warehouse).
export async function getRecolectadasReparacionExternaData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  return ExternalRepair.find({
    status: EXTERNAL_REPAIR_STATUS.RECOLECTADA,
    active: true
  })
    .populate([{ path: 'pickupAssignedTo', select: '_id name' }])
    .sort({ pickupCompletedAt: -1 })
    .lean();
}

export async function getExternalRepairsData(userId, pending = true) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const user = await User.findById(userId).populate('role').lean();
  const filter = pending
    ? { status: { $nin: TERMINAL_STATUSES }, active: true }
    : { status: { $in: TERMINAL_STATUSES } };

  // Technicians only see the repairs assigned to them; route operators only see
  // the deliveries assigned to them.
  if (user?.role?.id === 'TEC') {
    filter.takenBy = userId;
  } else if (user?.role?.id === 'OPE') {
    // Route operators see the pickups and the deliveries assigned to them.
    filter.$or = [
      { pickupAssignedTo: userId },
      { deliveryAssignedTo: userId }
    ];
  }

  const repairs = await ExternalRepair.find(filter)
    .populate([
      { path: 'takenBy', select: '_id name' },
      { path: 'repairedBy', select: '_id name' },
      { path: 'pickupAssignedTo', select: '_id name' },
      { path: 'deliveryAssignedTo', select: '_id name' }
    ])
    .sort({ createdAt: -1 })
    .lean();
  return repairs;
}

export async function getExternalRepairById(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const repair = await ExternalRepair.findById(id)
    .populate([
      { path: 'takenBy', select: '_id name' },
      { path: 'repairedBy', select: '_id name' },
      { path: 'deliveryAssignedTo', select: '_id name' },
      { path: 'deliveredBy', select: '_id name' },
      { path: 'pickupAssignedTo', select: '_id name' },
      {
        path: 'usedInventory',
        populate: { path: 'inventoryProduct', model: 'inventories' }
      }
    ])
    .lean();
  return repair;
}

export async function addUsedProductToExternalRepair({
  repairId,
  productId,
  qty,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const repair = await ExternalRepair.findById(repairId);
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    if (repair.status !== EXTERNAL_REPAIR_STATUS.POR_EVALUAR) {
      error.message =
        'Solo se pueden agregar refacciones mientras el presupuesto está en evaluación.';
      throw error;
    }

    const product = await Inventory.findById(productId);
    if (!product) {
      error.message = 'No se encontró el producto indicado.';
      throw error;
    }
    if (product.stock < qty) {
      error.message = 'No hay suficiente cantidad de la refacción indicada.';
      throw error;
    }

    const existingUsed = await UsedInventory.findOne({
      externalRepair: repairId,
      inventoryProduct: productId
    });
    if (existingUsed) {
      error.message = 'Este producto ya fue agregado a la reparación.';
      throw error;
    }

    const newUsedInventory = new UsedInventory({
      inventoryProduct: productId,
      externalRepair: repairId,
      qty,
      // External repairs are billed to the client, so use the sale price.
      price: product.sellPrice,
      date: Date.now(),
      createdBy: lastUpdatedBy
    });

    product.stock -= qty;
    product.updatedAt = Date.now();
    product.lastUpdatedBy = lastUpdatedBy;

    await session.startTransaction();
    await product.save({ session, new: false });
    await newUsedInventory.save({ session, new: true });

    const usedInventories = repair.usedInventory || [];
    usedInventories.push(newUsedInventory._id);
    repair.usedInventory = usedInventories;
    repair.updatedAt = Date.now();
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return newUsedInventory;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al agregar la refacción. Intente de nuevo.'
      );
    }
  }
}

export async function removeUsedProductFromExternalRepair({
  usedInventoryId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const used = await UsedInventory.findById(usedInventoryId);
    if (!used || !used.externalRepair) {
      error.message = 'No se encontró la refacción indicada.';
      throw error;
    }
    const repair = await ExternalRepair.findById(used.externalRepair);
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    if (repair.status !== EXTERNAL_REPAIR_STATUS.POR_EVALUAR) {
      error.message =
        'Solo se pueden quitar refacciones mientras el presupuesto está en evaluación.';
      throw error;
    }

    const product = await Inventory.findById(used.inventoryProduct);

    await session.startTransaction();
    if (product) {
      product.stock += used.qty;
      product.updatedAt = Date.now();
      product.lastUpdatedBy = lastUpdatedBy;
      await product.save({ session, new: false });
    }
    repair.usedInventory = (repair.usedInventory || []).filter(
      (id) => id.toString() !== usedInventoryId.toString()
    );
    repair.updatedAt = Date.now();
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });
    await UsedInventory.deleteOne({ _id: usedInventoryId }).session(session);

    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al quitar la refacción. Intente de nuevo.'
      );
    }
  }
}

// Technician submits the budget: parts total + labor. Moves the repair to
// ESPERANDO_AUTORIZACION and starts the 48h office reminder clock.
export async function submitExternalRepairBudget({
  repairId,
  laborAmount,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const labor = Number(laborAmount);
    if (Number.isNaN(labor) || labor < 0) {
      error.message = 'El monto de mano de obra debe ser un número válido.';
      throw error;
    }

    const repair = await ExternalRepair.findById(repairId).populate(
      'usedInventory'
    );
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    if (repair.status !== EXTERNAL_REPAIR_STATUS.POR_EVALUAR) {
      error.message = 'La reparación ya no está en evaluación de presupuesto.';
      throw error;
    }

    const partsTotal = (repair.usedInventory || []).reduce(
      (sum, u) => sum + (u.qty || 0) * (u.price || 0),
      0
    );
    const currentDate = Date.now();

    await session.startTransaction();
    repair.laborAmount = labor;
    repair.budgetAmount = partsTotal + labor;
    repair.budgetSubmittedAt = currentDate;
    repair.status = EXTERNAL_REPAIR_STATUS.ESPERANDO_AUTORIZACION;
    // First reminder to the office is due 48h from submission.
    repair.nextReminderAt = new Date(currentDate + 48 * HOUR_MS);
    repair.reminderCount = 0;
    repair.updatedAt = currentDate;
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
    return repair;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al enviar el presupuesto. Intente de nuevo.'
      );
    }
  }
}

// Office authorizes the client-approved budget: technician gets 3 days to repair.
export async function authorizeExternalRepairBudget({
  repairId,
  lastUpdatedBy
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  const repair = await ExternalRepair.findById(repairId);
  if (!repair) {
    error.message = 'No se encontró la reparación indicada.';
    throw error;
  }
  if (repair.status !== EXTERNAL_REPAIR_STATUS.ESPERANDO_AUTORIZACION) {
    error.message = 'La reparación no está esperando autorización.';
    throw error;
  }
  const currentDate = Date.now();
  repair.status = EXTERNAL_REPAIR_STATUS.AUTORIZADA;
  repair.authorizedAt = currentDate;
  repair.authorizedBy = lastUpdatedBy;
  repair.repairDeadline = new Date(currentDate + 3 * DAY_MS);
  repair.nextReminderAt = null;
  repair.updatedAt = currentDate;
  repair.lastUpdatedBy = lastUpdatedBy;
  await repair.save({ new: false });
  return repair;
}

// Office rejects the budget: the machine must be returned to the client within
// 3 days. Office schedules the return through the delivery flow (no charge).
export async function rejectExternalRepairBudget({ repairId, lastUpdatedBy }) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  const repair = await ExternalRepair.findById(repairId);
  if (!repair) {
    error.message = 'No se encontró la reparación indicada.';
    throw error;
  }
  if (repair.status !== EXTERNAL_REPAIR_STATUS.ESPERANDO_AUTORIZACION) {
    error.message = 'La reparación no está esperando autorización.';
    throw error;
  }
  const currentDate = Date.now();
  repair.status = EXTERNAL_REPAIR_STATUS.NO_AUTORIZADA;
  repair.rejectedAt = currentDate;
  repair.rejectedBy = lastUpdatedBy;
  // Return has no charge; office schedules it like a delivery.
  repair.chargeAmount = 0;
  // Route has 3 days to return the machine to the client.
  repair.returnDeadline = new Date(currentDate + 3 * DAY_MS);
  repair.nextReminderAt = null;
  repair.updatedAt = currentDate;
  repair.lastUpdatedBy = lastUpdatedBy;
  await repair.save({ new: false });
  return repair;
}

// On-read SLA engine for external repairs. Intended to be called when office
// staff load the external-repairs list. Handles:
//   1) the 48h budget follow-up reminders,
//   2) flagging returns overdue past the 3-day deadline (office alert),
//   3) blocking the office (all active AUX users) when a return is more than 24h
//      past its deadline, with a legend explaining why and how to avoid it.
export async function evaluateExternalRepairSLAs() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const now = new Date();

  // 1) 48h budget follow-up reminders.
  const dueReminders = await ExternalRepair.find({
    status: EXTERNAL_REPAIR_STATUS.ESPERANDO_AUTORIZACION,
    active: true,
    nextReminderAt: { $ne: null, $lte: now }
  })
    .select('totalNumber customerName brand budgetAmount reminderCount')
    .lean();
  if (dueReminders.length > 0) {
    await ExternalRepair.updateMany(
      { _id: { $in: dueReminders.map((d) => d._id) } },
      {
        $set: { nextReminderAt: new Date(now.getTime() + 48 * HOUR_MS) },
        $inc: { reminderCount: 1 }
      }
    );
  }

  // 2) Returns overdue past the 3-day deadline.
  const overdueReturns = await ExternalRepair.find({
    status: EXTERNAL_REPAIR_STATUS.NO_AUTORIZADA,
    active: true,
    returnDeadline: { $ne: null, $lte: now }
  })
    .select('totalNumber customerName returnDeadline officeAlertedAt')
    .lean();

  const toAlert = overdueReturns.filter((r) => !r.officeAlertedAt);
  if (toAlert.length > 0) {
    await ExternalRepair.updateMany(
      { _id: { $in: toAlert.map((r) => r._id) } },
      { $set: { officeAlertedAt: now } }
    );
  }

  // 3) Block the office (all active AUX) when a return is >24h past its deadline.
  const toBlock = overdueReturns.filter(
    (r) => now.getTime() > new Date(r.returnDeadline).getTime() + 24 * HOUR_MS
  );
  let blocked = false;
  if (toBlock.length > 0) {
    const auxRole = await Role.findOne({ id: 'AUX' });
    if (auxRole) {
      const folios = toBlock.map((r) => `#${r.totalNumber}`).join(', ');
      const reason =
        `Oficina bloqueada: la(s) reparación(es) externa(s) ${folios} no se entregaron ` +
        `al cliente dentro del plazo tras no autorizarse el presupuesto. Para desbloquear, ` +
        `complete la devolución de inmediato. Para evitarlo, devuelva el equipo dentro de ` +
        `los 3 días posteriores a la no autorización.`;
      await User.updateMany(
        { role: auxRole._id, isActive: true },
        { $set: { isBlocked: true, blockReason: reason } }
      );
      blocked = true;
    }
  }

  return { reminders: dueReminders, overdueReturns, blocked };
}

// Technician marks the authorized repair as done. The repairing technician stays
// linked via repairedBy (kept for the delivery + 30-day warranty). Requires
// evidence photos and a description of the work performed.
export async function completeExternalRepair({
  repairId,
  description,
  files,
  lastUpdatedBy
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  const repair = await ExternalRepair.findById(repairId);
  if (!repair) {
    error.message = 'No se encontró la reparación indicada.';
    throw error;
  }
  if (repair.status !== EXTERNAL_REPAIR_STATUS.AUTORIZADA) {
    error.message = 'La reparación no está autorizada.';
    throw error;
  }
  if (!description || !description.trim()) {
    error.message = 'Describa el trabajo realizado en la reparación.';
    throw error;
  }
  const photoFiles = Object.values(files || {}).filter(Boolean);
  if (photoFiles.length === 0) {
    error.message = 'Suba al menos una foto de evidencia de la reparación.';
    throw error;
  }

  // Upload the evidence photos in parallel before saving.
  const evidencePhotos = await Promise.all(
    photoFiles.map((file) =>
      uploadFile(
        file.filepath,
        `external_repair_evidence_${repair.totalNumber}_${new Date().getTime()}_${Math.floor(
          Math.random() * 1e6
        )}.${getFileExtension(file.originalFilename)}`
      )
    )
  );

  const currentDate = Date.now();
  repair.status = EXTERNAL_REPAIR_STATUS.REPARADA;
  repair.repairedBy = repair.takenBy;
  repair.repairedAt = currentDate;
  repair.repairDescription = description.trim();
  repair.repairEvidencePhotos = evidencePhotos;
  repair.updatedAt = currentDate;
  repair.lastUpdatedBy = lastUpdatedBy;
  await repair.save({ new: false });
  return repair;
}

// Office schedules the delivery to the client: assigns a route operator and a
// date, and freezes the amount to charge (the authorized budget total).
export async function scheduleExternalRepairDelivery({
  repairId,
  operatorId,
  scheduledDate,
  lastUpdatedBy
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  const repair = await ExternalRepair.findById(repairId);
  if (!repair) {
    error.message = 'No se encontró la reparación indicada.';
    throw error;
  }
  const isRepair = repair.status === EXTERNAL_REPAIR_STATUS.REPARADA;
  const isReturn = repair.status === EXTERNAL_REPAIR_STATUS.NO_AUTORIZADA;
  if (!isRepair && !isReturn) {
    error.message =
      'Solo se puede programar la entrega de una reparación reparada o no autorizada.';
    throw error;
  }
  if (!scheduledDate) {
    error.message = 'Indique la fecha de entrega.';
    throw error;
  }
  const operatorRole = await Role.findOne({ id: 'OPE' });
  const operator = await User.findOne({
    _id: operatorId,
    role: operatorRole?._id,
    isActive: true
  });
  if (!operator) {
    error.message = 'Chofer (operador) no válido o inactivo.';
    throw error;
  }
  const currentDate = Date.now();
  repair.deliveryAssignedTo = operator._id;
  repair.deliveryScheduledDate = new Date(scheduledDate);
  // A repaired machine is charged the budget total; a rejected (return) is not.
  repair.chargeAmount = isRepair ? repair.budgetAmount : 0;
  repair.updatedAt = currentDate;
  repair.lastUpdatedBy = lastUpdatedBy;
  await repair.save({ new: false });
  return repair;
}

// Office postpones the delivery. Allowed any number of times, but each postpone
// must include a follow-up note.
export async function postponeExternalRepairDelivery({
  repairId,
  scheduledDate,
  note,
  lastUpdatedBy
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  if (!note || !note.trim()) {
    error.message = 'Debe agregar una nota de seguimiento para posponer la entrega.';
    throw error;
  }
  if (!scheduledDate) {
    error.message = 'Indique la nueva fecha de entrega.';
    throw error;
  }
  const repair = await ExternalRepair.findById(repairId);
  if (!repair) {
    error.message = 'No se encontró la reparación indicada.';
    throw error;
  }
  const isDeliverable =
    repair.status === EXTERNAL_REPAIR_STATUS.REPARADA ||
    repair.status === EXTERNAL_REPAIR_STATUS.NO_AUTORIZADA;
  if (!isDeliverable || !repair.deliveryAssignedTo) {
    error.message = 'La entrega no está programada.';
    throw error;
  }
  const currentDate = Date.now();
  repair.followUpNotes.push({
    note: note.trim(),
    date: currentDate,
    createdBy: lastUpdatedBy
  });
  repair.deliveryScheduledDate = new Date(scheduledDate);
  repair.updatedAt = currentDate;
  repair.lastUpdatedBy = lastUpdatedBy;
  await repair.save({ new: false });
  return repair;
}

// Driver closes the delivery: records the collected amount, sets a 30-day
// warranty and keeps the repairing technician linked (repairedBy).
export async function completeExternalRepairDelivery({
  repairId,
  deliveredBy,
  method,
  folio,
  paymentAccountId,
  files,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const repair = await ExternalRepair.findById(repairId);
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    const isRepair = repair.status === EXTERNAL_REPAIR_STATUS.REPARADA;
    const isReturn = repair.status === EXTERNAL_REPAIR_STATUS.NO_AUTORIZADA;
    if ((!isRepair && !isReturn) || !repair.deliveryAssignedTo) {
      error.message = 'La entrega no está programada.';
      throw error;
    }

    // Evidence photo is mandatory for every delivery, whether the machine was
    // repaired or is being returned (rejected budget).
    if (!files?.evidence) {
      error.message = 'La foto de evidencia de la entrega es obligatoria.';
      throw error;
    }

    // A repaired delivery collects payment; a return (rejected budget) does not.
    if (isRepair) {
      if (!PAYMENT_METHODS[method]) {
        error.message = 'Indique un método de pago válido.';
        throw error;
      }
      const isCash = method === 'CASH' || method === 'CASH_OFFICE';
      if (!isCash && (!folio || !paymentAccountId || !files?.voucher)) {
        error.message =
          'Para pagos que no son en efectivo indique folio, cuenta y comprobante.';
        throw error;
      }
    }

    // Upload attachments (evidence + non-cash voucher) in parallel before the
    // transaction so it is not held open during network I/O.
    const [evidenceUrl, voucherUrl] = await Promise.all([
      files?.evidence
        ? uploadFile(
            files.evidence.filepath,
            `external_repair_delivery_${repair.totalNumber}_${new Date().getTime()}.${getFileExtension(
              files.evidence.originalFilename
            )}`
          )
        : Promise.resolve(null),
      files?.voucher
        ? uploadFile(
            files.voucher.filepath,
            `external_repair_voucher_${repair.totalNumber}_${new Date().getTime()}.${getFileExtension(
              files.voucher.originalFilename
            )}`
          )
        : Promise.resolve(null)
    ]);

    await session.startTransaction();
    repair.deliveredAt = currentDate;
    repair.deliveredBy = deliveredBy;
    repair.deliveryEvidenceUrl = evidenceUrl;
    repair.currentVehicle = null;
    repair.updatedAt = currentDate;
    repair.lastUpdatedBy = lastUpdatedBy;

    if (isReturn) {
      // Return to the client: no charge, no warranty.
      repair.status = EXTERNAL_REPAIR_STATUS.DEVUELTA;
      repair.returnedAt = currentDate;
      await repair.save({ session, new: false });
    } else {
      repair.status = EXTERNAL_REPAIR_STATUS.ENTREGADA;
      // 30-day warranty from delivery.
      repair.warrantyUntil = new Date(currentDate + 30 * DAY_MS);
      await repair.save({ session, new: false });

      // Record the collected amount as an EXTERNAL_REPAIR payment so it shows up
      // in the financial reports. External clients are not registered customers,
      // so the payment has no customer reference.
      const lastPayment = await Payment.findOne()
        .sort({ number: -1 })
        .select('number')
        .lean();
      await new Payment({
        number: lastPayment ? lastPayment.number + 1 : 1,
        amount: repair.chargeAmount || 0,
        customer: null,
        reason: 'EXTERNAL_REPAIR',
        description: PAYMENT_REASONS.EXTERNAL_REPAIR,
        method,
        folio: folio || null,
        paymentAccount: paymentAccountId || null,
        voucherUrl: voucherUrl || null,
        date: currentDate,
        lastUpdatedBy
      }).save({ session, new: true });
    }

    await session.commitTransaction();
    await session.endSession();
    return repair;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al completar la entrega. Intente de nuevo.'
      );
    }
  }
}
