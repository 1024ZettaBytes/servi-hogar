import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import { getTimeFromDate } from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Residence } from "../models/Residence";

Rent.init();
Residence.init();

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

export async function getDeliveryData(deliveryId) {
    if (!isConnected()) {
      await connectToDatabase();
    }
    const delivery = await RentDelivery.findById(deliveryId)
      .populate([
        {
          path: "rent",
          populate: [
            {
                path: "customer",
                model: "customers",
                populate: {
                  path: "currentResidence",
                  model: "residences",
                  populate: [
                    {
                      path: "city",
                      model: "cities",
                      populate: {
                        path: "sectors",
                        model: "sectors",
                      },
                    },
                    {
                      path: "sector",
                      model: "sectors",
                    },
                  ],
                  
                },
              },
          ],
        }
      ])
      .exec();
    return delivery;
  }

export async function cancelDeliveryData({ deliveryId, lastUpdatedBy }) {
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
    const cancelledStatus = await RentStatus.findOne({ id: "CANCELADA" });
    let rent = await Rent.findById(delivery.rent).populate();
    let customer = await Customer.findById(rent.customer);
    customer.hasRent = false;
    customer.currentRent = null;
    await customer.save({ session, new: false });

    rent.status = cancelledStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    delivery.status = "CANCELADA";
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
        "Ocurrió un error al cancelar la entrega. Intente de nuevo."
      );
    }
  }
}
