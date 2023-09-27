import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import {
  dateDiffInDays,
  getFileExtension,
  getTimeFromDate,
} from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { CustomerLevel } from "../models/CustomerLevel";
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
import { CustomerMovement } from "../models/CustomerMovement";
import { Payment } from "../models/Payment";
import { MACHINE_MOVEMENT_LIST, PAYMENT_REASONS } from "../consts/OBJ_CONTS";
import { MachineMovement } from "../models/MachineMovement";
import { User } from "../models/User";
import { Vehicle } from "../models/Vehicle";
CustomerLevel.init();
Residence.init();
City.init();
Sector.init();

const getNextPickupTotalNumber = async () => {
  const totalPickups = await RentPickup.find({
    status: { $ne: "REPROGRAMADO" },
  });
  return totalPickups.length + 1;
};
const getNextPickupDayNumber = async (pickupDate) => {
  const start = dayjs(pickupDate).startOf("day");
  const end = dayjs(pickupDate).endOf("day");
  const todayPickups = await RentPickup.find({
    date: { $gte: start, $lt: end },
    status: { $ne: "REPROGRAMADO" },
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
    let pickup = await new RentPickup({
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
    pickup.rent.remaining = dateDiffInDays(
      new Date(Date.now()),
      new Date(rent.endDate)
    );
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
      populate: [
        {
          path: "customer",
          populate: "currentResidence",
        },
        "machine",
      ],
    }).lean();  
    return pastPickups.sort((a, b) => {
      if (a.status === "CANCELADA" && b.status === "CANCELADA") {
        return b.updatedAt - a.updatedAt; // Sort by updatedAt in descending order for CANCELADA
      }
      if (a.status === "RECOLECTADA" && b.status === "RECOLECTADA") {
        return b.finishedAt - a.finishedAt; // Sort by finishedAt in descending order for RECOLECTADA
      }
      if (a.status === "RECOLECTADA" && b.status === "CANCELADA") {
        return b.updatedAt - a.finishedAt; // Sort by finishedAt in descending order for RECOLECTADA
      }
      if (a.status === "CANCELADA" && b.status === "RECOLECTADA") {
        return b.finishedAt - a.updatedAt; // Sort by finishedAt in descending order for RECOLECTADA
      }
    });
}

export async function getPendingPickupsData(userId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const user = await User.findById(userId).populate("role").lean();
  let filter = { status: { $in: ["ESPERA", "EN_CAMINO", "EN_DOMICILIO"] } };
  if (user.role.id === "OPE") {
    filter.operator = userId;
  }
  const pendingPickups = await RentPickup.find(filter)
    .populate([
      { path: "operator", select: "_id name" },
      {
        path: "rent",
        populate: [
          {
            path: "customer",
            populate: {
              path: "currentResidence",
              populate: ["city", "sector", "maps"],
            },
          },
          {
            path: "machine",
            select: "machineNum",
          },
        ],
      },
    ])
    .sort({ date: 1 })
    .lean();
  for (let index in pendingPickups) {
    const endDate = pendingPickups[index].rent.endDate;
    pendingPickups[index].rent.remaining = dateDiffInDays(
      new Date(Date.now()),
      new Date(endDate)
    );
  }
  return pendingPickups;
}

export async function getPickupData(pickupId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pickup = await RentPickup.findById(pickupId)
    .lean()
    .populate([
      {
        path: "rent",
        populate: [
          {
            path: "customer",
            model: "customers",
            populate: [
              {
                path: "level",
                model: "customer_levels",
              },
              {
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
            ],
          },
          "machine",
        ],
      },
    ])
    .exec();
  if (pickup) {
    pickup.rent.remaining = dateDiffInDays(
      new Date(Date.now()),
      new Date(pickup.rent.endDate)
    );
  }
  return pickup;
}

export async function markCompletePickupData({
  pickupId,
  whitDebt,
  payDone,
  pickupDate,
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
    let pickup = await RentPickup.findById(pickupId).populate({
      path: "operator",
      select: "name",
    });
    if (pickup.operator == null) {
      error.message = "La recolección no tiene ningún operador asignado";
      throw error;
    }
    if (!pickup || !["ESPERA", "EN_CAMINO"].includes(pickup.status)) {
      error.message =
        "La recolección indicada no existe o no tiene estatus válido";
      throw error;
    }

    let rent = await Rent.findById(pickup.rent);
    let rentAccesories = rent.accesories;
    let customer = await Customer.findById(rent.customer)
      .populate("level")
      .exec();
    let machine = await Machine.findById(rent.machine);
    if (payDone) {
      const paymentList = await Payment.find().lean();
      const paymentNum = paymentList.length;
      const paymentAmount = customer.level.dayPrice * whitDebt;
      let newPayment = await new Payment({
        number: paymentNum + 1,
        customer,
        amount: paymentAmount,
        reason: "DEBT",
        description: PAYMENT_REASONS.DEBT,
        folio: null,
        method: "CASH",
        date: pickupDate,
        lastUpdatedBy,
      }).save({ session, new: true });
      const payMovement = await new MachineMovement({
        machine,
        type: MACHINE_MOVEMENT_LIST.DEBT,
        description: `Deuda de cliente ${whitDebt} día(s)`,
        amount: paymentAmount,
        date: pickupDate,
      }).save({ session, new: true });
      machine.movements.push(payMovement._id);
      machine.earnings = machine.earnings + paymentAmount;
    } else {
      const debt = customer.level.dayPrice * whitDebt;
      const customerMovement = await new CustomerMovement({
        customer,
        rent: rent._id,
        machine,
        type: "DEBT",
        description: `Deuda de -$${debt} generada`,
        date: currentDate,
      }).save({ session, new: true });
      customer.movements.push(customerMovement);
      customer.balance = customer.balance - debt;
    }
    customer.hasRent = false;
    customer.currentRent = null;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    if (customer.level.id === "permanente") {
      customer.level = await CustomerLevel.findOne({ id: "regular" });
    }
    await customer.save({ session, new: false });

    const collectedStatus = await MachineStatus.findOne({ id: "REC" });
    machine.status = collectedStatus;
    //Get vehicle from operator
    let vehicle = await Vehicle.findOne({ operator: pickup.operator._id });
    vehicle.machinesOn.push(machine._id);
    await vehicle.save({ session, new: false });

    machine.currentVehicle = vehicle._id;
    machine.currentWarehouse = null;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    const finishedRentStatus = await RentStatus.findOne({ id: "FINALIZADA" });
    rent.status = finishedRentStatus;
    rent.endDate = pickupDate;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    rent.accesories = null;
    await rent.save({ session, new: false });

    pickup.pickedMachine = rent.machine;
    pickup.status = "RECOLECTADA";
    pickup.finishedAt = pickupDate;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    let accesories = {};
    if (rentAccesories) {
      Object.keys(rentAccesories).forEach((key) => {
        if (pickedAccesories[key]) {
          accesories[key] = true;
        }
      });
    }
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
    for (const [key] of Object.entries(files)) {
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
    if (pickup.wasSent) {
      // Save another pickup with previous data for reports
      await new RentPickup({
        totalNumber: pickup.totalNumber,
        dayNumber: pickup.dayNumber,
        rent: pickup.rent,
        status: "REPROGRAMADO",
        takenAt: pickup.takenAt,
        takenBy: pickup.takenBy,
        date: pickup.date,
        timeOption: pickup.timeOption,
        fromTime: pickup.fromTime,
        endTime: pickup.endTime,
        createdAt: currentDate,
        updatedAt: currentDate,
        lastUpdatedBy: lastUpdatedBy,
      }).save({ session, new: true });
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
    pickup.wasSent = false;
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

export async function setPickupSentData({ pickupId, wasSent, lastUpdatedBy }) {
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
      error.message = "No se encontró la recoleccón indicada.";
      throw error;
    }
    pickup.wasSent = wasSent;
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
