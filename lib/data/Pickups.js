import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { getFileExtension, getTimeFromDate } from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { RentPickup } from "../models/RentPickup";
import { Residence } from "../models/Residence";
import { City } from "../models/City";
import { Sector } from "../models/Sector";
import { RentChange } from "../models/RentChange";
import { deleteFile, uploadFile } from "../cloud";
import { getFileFromUrl } from "../client/utils";
import dayjs from "dayjs";
Residence.init();
City.init();
Sector.init();

const getNextPickupTotalNumber = async () => {
  const totalPickups = await RentPickup.find();
  return totalPickups.length + 1;
};
const getNextPickupDayNumber = async (pickupDate) => {
  const start = dayjs(pickupDate).startOf("day");
  const end = dayjs(pickupDate).endOf("day");
  const todayPickups = await RentPickup.find({
    date: { $gte: start, $lt: end },
  });
  return todayPickups.length + 1;
};

export async function savePickupData({ rentId, pickupTime, lastUpdatedBy }) {
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
    if (!rent || !["RENTADO", "VENCIDA"].includes(rent.status.id)) {
      error.message = "La renta indicada no es válida";
      throw error;
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
    // Get next pickup number (by current day)
    const totalNumber = await getNextPickupTotalNumber();
    // Get next pickup number (by current day)
    const dayNumber = await getNextPickupDayNumber(new Date(pickupTime.date));
    const pickup = await new RentPickup({
      totalNumber,
      dayNumber,
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
    return pickup;
  } catch (e) {
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

export async function getPastPickupsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pastPickups = await RentPickup.find({
    status: { $in: ["RECOLECTADA", "CANCELADA"] },
  })
    .populate({
      path: "rent",
      populate: [{
        path: "customer",
        populate: "currentResidence",
      }, "machine"],
    })
    .sort({ createdAt: -1 })
    .exec();
  return pastPickups;
}

export async function getPendingPickupsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingPickups = await RentPickup.find({
    status: { $in: ["ESPERA", "EN_CAMINO", "EN_DOMICILIO"] },
  })
    .populate({
      path: "rent",
      populate: {
        path: "customer",
        populate: "currentResidence",
      },
    })
    .sort({ date: 1 })
    .exec();
  return pendingPickups;
}

export async function getPickupData(pickupId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pickup = await RentPickup.findById(pickupId)
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
          "machine",
        ],
      },
    ])
    .exec();
  return pickup;
}

export async function markCompletePickupData({
  pickupId,
  pickedAccesories,
  files,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let pickup = await RentPickup.findById(pickupId);
    if (!pickup || !["ESPERA", "EN_CAMINO"].includes(pickup.status)) {
      error.message =
        "La recolección indicada no existe o no tiene estatus válido";
      throw error;
    }

    let rent = await Rent.findById(pickup.rent);
    let rentAccesories = rent.accesories;
    let customer = await Customer.findById(rent.customer);
    let machine = await Machine.findById(rent.machine);

    customer.hasRent = false;
    customer.currentRent = null;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({ session, new: false });

    const collectedStatus = await MachineStatus.findOne({ id: "REC" });
    machine.status = collectedStatus;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    const finishedRentStatus = await RentStatus.findOne({ id: "FINALIZADA" });
    rent.status = finishedRentStatus;
    rent.endDate = currentDate;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    rent.accesories = null;
    await rent.save({ session, new: false });

    pickup.pickedMachine = rent.machine;
    pickup.status = "RECOLECTADA";
    pickup.finishedAt = currentDate;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    let accesories = {};
    Object.keys(rentAccesories).forEach((key) => {
      if (pickedAccesories[key]) {
        accesories[key] = true;
      }
    });
    pickup.pickedAccesories = accesories;
    // Find and delete all images from rent changes
    const changes = await RentChange.find({ rent });
    for (let i = 0; i < changes.length; i++) {
      let change = changes[i];
      const imgObj = change.imagesUrl;
      if (imgObj) {
        change.imagesUrl = null;
        await change.save({ session, new: false });
        for (const [key] of Object.entries(imgObj)) {
          const fileName = getFileFromUrl(imgObj[key]);
          await deleteFile(fileName);
        }
      }
    }
    let imagesUrl = {};
    for(const [key] of Object.entries(files)) {
      const fileName = `pickup_${key}_${pickup.totalNumber}.${getFileExtension(
        files[key].originalFilename
      )}`;
      const url = await uploadFile(files[key].filepath, fileName);
      imagesUrl[key] = url;
    }
    pickup.imagesUrl = imagesUrl;
    
    await pickup.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al completar la recolección. Intente de nuevo."
      );
    }
  }
}

export async function updatePickupTimeData({
  pickupId,
  pickupTime,
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
    let pickup = await RentPickup.findById(pickupId);
    if (!pickup) {
      error.message = "No se encontró la recolección indicada.";
      throw error;
    }
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
    pickup.date = date;
    pickup.timeOption = pickupTime.timeOption;
    pickup.fromTime = fromTime;
    pickup.endTime = endTime;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    await pickup.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al actualizar la recolección. Intente de nuevo."
      );
    }
  }
}

export async function cancelPickupData({
  pickupId,
  cancellationReason,
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
    let pickup = await RentPickup.findById(pickupId);
    if (!pickup) {
      error.message = "No se encontró la recolección indicada.";
      throw error;
    }
    const onRentStatus = await RentStatus.findOne({ id: "RENTADO" });
    let rent = await Rent.findById(pickup.rent);
    rent.status = onRentStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    pickup.status = "CANCELADA";
    pickup.cancellationReason = cancellationReason;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    await pickup.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al cancelar la recolección. Intente de nuevo."
      );
    }
  }
}
