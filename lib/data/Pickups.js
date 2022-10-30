import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import {
  getTimeFromDate,
  getFileExtension,
  addDaysToDate,
  setDateToInitial,
} from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Residence } from "../models/Residence";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { RentPickup } from "../models/RentPickup";
import { Vehicle } from "../models/Vehicle";
import { CustomerLevel } from "../models/CustomerLevel";
import { CustomerMovement } from "../models/CustomerMovement";
import { updateResidenceDataFunc } from "./Customers";
import { MACHINE_MOVEMENT_LIST } from "../consts/OBJ_CONTS";
import { uploadFile } from "../cloud";

export async function savePickupData({
  rentId,
  pickupTime,
  lastUpdatedBy
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
    let rent = await Rent.findById(rentId).populate("status");
    if (!rent || !(["RENTADO", "VENCIDA"].includes(rent.status.id))) {
      error.name = "La renta indicada no es válida";
      throw error
    }
    const onPickupStatus = await RentStatus.findOne({ id: "EN_RECOLECCION" });
    rent.status = onPickupStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    let date = new Date(pickupTime.date);
    let fromTime = new Date(pickupTime.date);
    let endTime = new Date(pickupTime.date);
    if (pickupTime.timeOption === "any") {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(pickupTime.fromTime));
      const endT = getTimeFromDate(new Date(pickupTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }

    await new RentPickup({
      rent,
      date,
      timeOption: pickupTime.timeOption,
      fromTime,
      endTime,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });
    
    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al guardar la recolección. Intente de nuevo."
      );
    }
  }
}
