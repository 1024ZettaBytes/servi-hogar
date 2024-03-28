import { connectToDatabase, isConnected } from '../db';
import { Customer } from '../models/Customer';
import { Machine } from '../models/Machine';
import { Residence } from '../models/Residence';
import { getFileExtension } from '../client/utils';
import { Payment } from '../models/Payment';
import { PAYMENT_REASONS, PAYMENT_METHODS } from '../consts/OBJ_CONTS';
import { uploadFile } from '../cloud';
Machine.init();
Residence.init();

export async function savePaymentData({
  customerId,
  reason,
  method,
  account,
  amount,
  paymentDate,
  folio,
  files,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let customer = await Customer.findById(customerId);
    if (!customer) {
      error.message = 'El cliente indicado no es válido';
      throw error;
    }
    if (!PAYMENT_REASONS[reason]) {
      error.message = 'El concepto indicado no es válido';
      throw error;
    }
    if (!PAYMENT_METHODS[method]) {
      error.message = 'El método indicado no es válido';
      throw error;
    }
    if (
      method !== 'CASH' &&
      method !== 'CASH_OFFICE' &&
      (!folio || !files || !account)
    ) {
      error.message = 'Por favor indique folio y comprobante de pago';
      throw error;
    }
    if ((folio && !files) || (files && !folio)) {
      error.message = 'Por favor indique el folio y comprobante de pago';
      throw error;
    }
    if (!amount) {
      error.message = 'Por favor indique el la cantidad de pago';
      throw error;
    }
    let amoutNumber = new Number(amount);
    customer.balance = customer.balance + amoutNumber;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    const paymentNum = await Payment.countDocuments();
    if (folio) {
      const folioAlreadyExists = await Payment.find({ method, folio });
      if (folioAlreadyExists.length > 0) {
        error.message = 'El folio indicado ya existe para el método de pago';
        throw error;
      }
    }
    let accountNumber = null;
    if (!['CASH', 'CASH_OFFICE'].includes(method)) {
      if (!account || account.trim().length == 0) {
        error.message = 'Por favor indique una cuenta válida.';
        throw error;
      }
      accountNumber = '*****' + account.trim();
    }
    let newPayment = new Payment({
      number: paymentNum + 1,
      customer,
      amount: amoutNumber,
      reason,
      description: PAYMENT_REASONS[reason],
      folio: folio || null,
      method,
      account: accountNumber,
      date: paymentDate,
      lastUpdatedBy
    });
    if (files) {
      let fileName = `voucher_${paymentNum + 1}.${getFileExtension(
        files.file.originalFilename
      )}`;
      const voucherUrl = await uploadFile(files.file.filepath, fileName);
      newPayment.voucherUrl = voucherUrl;
    }
    await session.startTransaction();
    await customer.save({ session, new: false });
    await newPayment.save({ session, new: true });
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
      throw new Error('Ocurrío un error al guardar el pago. Intente de nuevo.');
    }
  }
}

export async function getPaymentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const paymentsList = await Payment.find()
    .select({
      number: 1,
      description: 1,
      method: 1,
      voucherUrl: 1,
      amount: 1,
      date: 1,
      customer: 1,
      account: 1,
      folio: 1
    })
    .populate({ path: 'customer', select: 'name', model: 'customers' })
    .sort({ number: -1 })
    .lean();

  return paymentsList;
}
