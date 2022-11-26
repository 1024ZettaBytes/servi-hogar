import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { getFileExtension, getTimeFromDate } from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { RentChange } from "../models/RentChange";
import { Residence } from "../models/Residence";
import { Customer } from "../models/Customer";
import { City } from "../models/City";
import { Sector } from "../models/Sector";
import { ACCESORIES_LIST } from "../consts/OBJ_CONTS";
import dayjs from "dayjs";
import { uploadFile } from "../cloud";
import { Vehicle } from "../models/Vehicle";
Residence.init();
City.init();
Sector.init();
Customer.init();
Rent.init();

const getNextChangeTotalNumber = async () => {
  const totalChanges = await RentChange.find();
  return totalChanges.length + 1;
};
const getNextChangeDayNumber = async (changeDate) => {
  const start = dayjs(changeDate).startOf("day");
  const end = dayjs(changeDate).endOf("day");
  const todayChanges = await RentChange.find({
    date: { $gte: start, $lt: end },
  });
  return todayChanges.length + 1;
};

export async function saveChangeData({
  rentId,
  changeTime,
  reason,
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
    let rent = await Rent.findById(rentId).populate("status");
    if (!rent || rent.status.id !== "RENTADO") {
      error.message = "La renta indicada no es válida";
      throw error;
    }

    const onChangeStatus = await RentStatus.findOne({ id: "EN_CAMBIO" });
    rent.status = onChangeStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    let date = new Date(changeTime.date);
    let fromTime = new Date(changeTime.date);
    let endTime = new Date(changeTime.date);
    if (changeTime.timeOption === "any") {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(changeTime.fromTime));
      const endT = getTimeFromDate(new Date(changeTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }
    // Get next change number (by current day)
    const totalNumber = await getNextChangeTotalNumber();
    // Get next change number (by current day)
    const dayNumber = await getNextChangeDayNumber(new Date(changeTime.date));
    const change = await new RentChange({
      totalNumber,
      dayNumber,
      rent,
      date,
      reason,
      timeOption: changeTime.timeOption,
      fromTime,
      endTime,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return change;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al guardar el cambio. Intente de nuevo."
      );
    }
  }
}
export async function getPastChangesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pastChanges = await RentChange.find({
    status: { $in: ["FINALIZADO", "CANCELADO"] },
  })
    .populate([
      {
        path: "rent",
        populate: {
          path: "customer",
          populate: "currentResidence",
        },
      },
      "pickedMachine",
      "leftMachine",
    ])
    .sort({ createdAt: -1 })
    .exec();
  return pastChanges;
}
export async function getPendingChangesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingChanges = await RentChange.find({
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
  return pendingChanges;
}

export async function getChangeData(changeId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const change = await RentChange.findById(changeId)
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
  return change;
}

export async function markCompleteChangeData({
  changeId,
  wasFixed,
  problemDesc,
  solutionDesc,
  newMachine,
  changedAccesories,
  files,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let change = await RentChange.findById(changeId);
    if (!change || !["ESPERA", "EN_CAMINO"].includes(change.status)) {
      error.message = "El cambio indicado no existe o no tiene estatus válido";
      throw error;
    }

    let rent = await Rent.findById(change.rent);
    let rentAccesories = rent.accesories;
    if (!wasFixed) {
      const collectedStatus = await MachineStatus.findOne({ id: "REC" });
      let prevMachine = await Machine.findById(rent.machine);
      prevMachine.status = collectedStatus;
      prevMachine.currentVehicle = null;
      prevMachine.currentWarehouse = null;
      prevMachine.totalChanges = prevMachine.totalChanges + 1;
      prevMachine.updatedAt = currentDate;
      prevMachine.lastUpdatedBy = lastUpdatedBy;
      await prevMachine.save({ session, new: false });
      change.pickedMachine = prevMachine;
      // Left machine
      let machine = await Machine.findById(newMachine).populate("status");
      if (!machine || !["LISTO", "REC"].includes(machine.status.id)) {
        error.message = "El equipo indicado no esta disponible para dejar";
        throw error;
      }
      const rentMachineStatus = await MachineStatus.findOne({ id: "RENTADO" });
      machine.status = rentMachineStatus._id;
      machine.lastRent = rent._id;
      machine.updatedAt = currentDate;
      machine.currentWarehouse = null;
      if (machine.currentVehicle) {
        let vehicle = await Vehicle.findById(machine.currentVehicle);
        const machines = vehicle?.machinesOn.filter(
          (machOn) => machOn.toString() !== machine._id.toString()
        );
        vehicle.machinesOn = machines;
        await vehicle.save({ session, new: false });
      }
      machine.currentVehicle = null;
      machine.lastUpdatedBy = lastUpdatedBy;
      await machine.save({ session, new: false });

      rent.machine = machine;
      change.leftMachine = machine;
    } else {
      Object.keys(changedAccesories).forEach((key) => {
        if (changedAccesories[key] && ACCESORIES_LIST[key]) {
          rentAccesories[key] = true;
        }
      });
      rent.accesories = rent.accesories;
    }
    const onRentStatus = await RentStatus.findOne({ id: "RENTADO" });
    rent.status = onRentStatus;
    rent.totalChanges = rent.totalChanges + 1;
    rent.consecutiveChanges = rent.consecutiveChanges + 1;
    if (rent.consecutiveChanges >= 4) {
      let customer = await Customer.findById(rent.customer);
      customer.freeWeeks = customer.freeWeeks + 1;
      await customer.save({ session, new: false });
      rent.consecutiveChanges = 0;
    }
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    change.status = "FINALIZADO";
    change.wasFixed = wasFixed;
    change.problemDesc = problemDesc;
    change.solutionDesc = wasFixed ? solutionDesc : null;
    change.changedAccesories = changedAccesories;
    change.finishedAt = currentDate;
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    if (!wasFixed) {
      // Save attachments on cloud and change object
      let imagesUrl = {};
      for (const [key] of Object.entries(files)) {
        const fileName = `change_${key}_${
          change.totalNumber
        }.${getFileExtension(files[key].originalFilename)}`;
        const url = await uploadFile(files[key].filepath, fileName);
        imagesUrl[key] = url;
      }
      change.imagesUrl = imagesUrl;
    }
    await change.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al completar el cambio. Intente de nuevo."
      );
    }
  }
}

export async function updateChangeTimeData({
  changeId,
  changeTime,
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
    let change = await RentChange.findById(changeId);
    if (!change) {
      error.message = "No se encontró el cambio indicado.";
      throw error;
    }
    let date = new Date(changeTime.date);
    let fromTime = new Date(changeTime.date);
    let endTime = new Date(changeTime.date);
    if (changeTime.timeOption === "any") {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(changeTime.fromTime));
      const endT = getTimeFromDate(new Date(changeTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }
    change.date = date;
    change.timeOption = changeTime.timeOption;
    change.fromTime = fromTime;
    change.endTime = endTime;
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al actualizar el cambio. Intente de nuevo."
      );
    }
  }
}

export async function cancelChangeData({
  changeId,
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
    let change = await RentChange.findById(changeId);
    if (!change) {
      error.message = "No se encontró el cambio indicado.";
      throw error;
    }
    const onRentStatus = await RentStatus.findOne({ id: "RENTADO" });
    let rent = await Rent.findById(change.rent);
    rent.status = onRentStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });
    change.cancellationReason = cancellationReason;
    change.status = "CANCELADO";
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al cancelar el cambio. Intente de nuevo."
      );
    }
  }
}
