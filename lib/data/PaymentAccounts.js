import { connectToDatabase } from '../db';
import { PaymentAccount } from '../models/PaymentAccount';

export async function getPaymentAccountsData() {
  await connectToDatabase();
  const accounts = await PaymentAccount.find({}).lean();
  return accounts;
}

export async function savePaymentAccountData({
  bank,
  number,
  type,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  await connectToDatabase();
  
  if (!bank || bank.trim().length === 0) {
    error.message = 'Por favor indique el banco';
    throw error;
  }
  
  if (!number || number.trim().length === 0) {
    error.message = 'Por favor indique el número de cuenta';
    throw error;
  }
  
  const validTypes = ['CARD', 'CLABE', 'ACCOUNT'];
  if (!type || !validTypes.includes(type)) {
    error.message = 'El tipo de cuenta no es válido';
    throw error;
  }

  // Check if account already exists
  const existingAccount = await PaymentAccount.findOne({ number });
  if (existingAccount) {
    error.message = 'Ya existe una cuenta con ese número';
    throw error;
  }

  // Get the next count number
  const lastAccount = await PaymentAccount.findOne().sort({ count: -1 });
  const nextCount = lastAccount ? lastAccount.count + 1 : 1;

  const newAccount = new PaymentAccount({
    count: nextCount,
    bank,
    number,
    type
  });

  await newAccount.save();
  return newAccount;
}

export async function deletePaymentAccountData(accountId) {
  let error = new Error();
  error.name = 'Internal';
  await connectToDatabase();
  
  const account = await PaymentAccount.findById(accountId);
  if (!account) {
    error.message = 'La cuenta indicada no existe';
    throw error;
  }

  await PaymentAccount.findByIdAndDelete(accountId);
  return { success: true };
}
