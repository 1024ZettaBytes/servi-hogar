import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import { getTimeFromDate } from "../client/utils";

export async function updateDeliveryTimeData({
  deliveryId,
  deliveryTime,
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
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery) {
      error.message = "No se encontró la entrega indicada.";
      throw error;
    }
    let date = new Date(deliveryTime.date);
    let fromTime = new Date(deliveryTime.date);
    let endTime = new Date(deliveryTime.date);
    if (deliveryTime.timeOption === "any") {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(deliveryTime.fromTime));
      const endT = getTimeFromDate(new Date(deliveryTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }
    delivery.date = date;
    delivery.timeOption = deliveryTime.timeOption;
    delivery.fromTime = fromTime;
    delivery.endTime = endTime;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al actualizar la entrega. Intente de nuevo."
      );
    }
  }
}

export async function getPendingDeliveriesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingDeliveries = await RentDelivery.find({
    status: { $in: ["ESPERA", "EN_CAMINO"] },
  })
    .populate("rent")
    .sort({ date: 1 })
    .exec();
  return pendingDeliveries;
}
