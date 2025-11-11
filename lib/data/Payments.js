import { connectToDatabase, isConnected } from '../db';
import { Customer } from '../models/Customer';
import { Machine } from '../models/Machine';
import { Residence } from '../models/Residence';
import { getFileExtension } from '../client/utils';
import { Payment } from '../models/Payment';
import { PAYMENT_REASONS, PAYMENT_METHODS } from '../consts/OBJ_CONTS';
import { uploadFile } from '../cloud';
import { User } from '../models/User';
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
  lastUpdatedBy,
  lateFee = 0
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
    if (folio) {
      const folioAlreadyExists = await Payment.findOne({ method, folio })
        .select({ _id: 1 })
        .lean();
      if (folioAlreadyExists) {
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
    const paymentNum = await Payment.countDocuments();
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
      lateFee: lateFee > 0 ? lateFee : 0,
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

export async function getPaymentsData(page, limit, searchTerm) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let nameFilter;
  if (searchTerm && searchTerm.trim() !== '') {
    const foundCustomers = await Customer.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .select({ name: 1 })
      .lean();
    nameFilter = foundCustomers.reduce((prev, curr) => {
      prev.push(curr._id);
      return prev;
    }, []);
    const foundUsers = await User.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .select({ name: 1 })
      .lean();
    if(foundUsers.length>0){
      nameFilter = nameFilter.concat(
        foundUsers.reduce((prev, curr) => {
          prev.push(curr._id);
          return prev;
        }, [])
      );
    }
  }
  const select = {
    number: 1,
    description: 1,
    method: 1,
    voucherUrl: 1,
    amount: 1,
    date: 1,
    customer: 1,
    account: 1,
    folio: 1,
    lateFee: 1,
    lastUpdatedBy: 1
  };
  const populate = [
    { path: 'customer', select: 'name', model: 'customers' },
    { path: 'lastUpdatedBy', select: 'name', model: 'users' }
  ];
  const paymentsList = await Payment.find(
    nameFilter
      ? {
          $or: [
            { customer: { $in: nameFilter } },
            { lastUpdatedBy: { $in: nameFilter } }
          ]
        }
      : {}
  )
    .select(select)
    .populate(populate)
    .limit(limit)
    .skip(limit * (page - 1))
    .sort({ number: -1 })
    .lean();

  return {
    list: paymentsList,
    total: await Payment.countDocuments(
      nameFilter
        ? {
            $or: [
              { customer: { $in: nameFilter } },
              { lastUpdatedBy: { $in: nameFilter } }
            ]
          }
        : {}
    )
  };
}
