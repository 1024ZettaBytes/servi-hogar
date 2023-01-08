import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { Customer } from "../models/Customer";
import { Machine } from "../models/Machine";
import { Residence } from "../models/Residence";
import {
  getFileExtension,
} from "../client/utils";
import { Payment } from "../models/Payment";
import { PAYMENT_REASONS, PAYMENT_METHODS } from "../consts/OBJ_CONTS";
import { uploadFile } from "../cloud";
Machine.init();
Residence.init();

export async function savePaymentData({
  customerId,
  reason,
  method,
  amount,
  folio,
  files,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }

    let customer = await Customer.findById(customerId);
    if (!customer) {
      error.message = "El cliente indicado no es válido";
      throw error;
    }
    if (!PAYMENT_REASONS[reason]) {
      error.message = "El concepto indicado no es válido";
      throw error;
    }
    if (!PAYMENT_METHODS[method]) {
      error.message = "El método indicado no es válido";
      throw error;
    }
    if (method !== "CASH" && (!folio || !files)) {
      error.message = "Por favor indique el folio y comprobante de pago";
      throw error;
    }
    if ((folio && !files) || (files && !folio)) {
      error.message = "Por favor indique el folio y comprobante de pago";
      throw error;
    }
    if (!amount) {
      error.message = "Por favor indique el la cantidad de pago";
      throw error;
    }
    let amoutNumber = new Number(amount);
    customer.balance = customer.balance + amoutNumber;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({ session, new: false });
    const paymentList = await Payment.find();
    const paymentNum = paymentList.length;
    if (folio) {
      const folioAlreadyExists = paymentList.some(
        (pay) => pay.method === method && pay.folio === folio
      );
      if (folioAlreadyExists) {
        error.message = "El folio indicado ya existe para el método de pago";
        throw error;
      }
    }
    let newPayment = await new Payment({
      number: paymentNum + 1,
      customer,
      amount: amoutNumber,
      reason,
      description: PAYMENT_REASONS[reason],
      folio: folio || null,
      method,
      date: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });
    if (files) {
      let fileName = `voucher_${paymentNum + 1}.${getFileExtension(
        files.file.originalFilename
      )}`;
      const voucherUrl = await uploadFile(files.file.filepath, fileName);
      newPayment.voucherUrl = voucherUrl;
      await newPayment.save({ session, new: false });
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error("Ocurrío un error al guardar el pago. Intente de nuevo.");
    }
  }
}

export async function getPaymentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const paymentsList = await Payment.find()
    .populate("customer")
    .sort({ date: -1 });

  return paymentsList;
}
