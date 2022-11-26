import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { Rent } from "../models/Rent";
import { Customer } from "../models/Customer";
import { RentStatus } from "../models/RentStatus";
import { RentDelivery } from "../models/RentDelivery";
import { Machine } from "../models/Machine";
import { Residence } from "../models/Residence";
import {
  getTimeFromDate,
  dateDiffInDays,
  dateDiffInWeeks,
  addDaysToDate,
  capitalizeFirstLetter,
} from "../client/utils";
import { CustomerMovement } from "../models/CustomerMovement";
import { MachineMovement } from "../models/MachineMovement";
import { MACHINE_MOVEMENT_LIST, WEEK_DAYS } from "../consts/OBJ_CONTS";
import { CustomerLevel } from "../models/CustomerLevel";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import dayjs from "dayjs";
Machine.init();
Residence.init();

const getNextDeliveryDayNumber = async (deliveryDate) => {
  const start = dayjs(deliveryDate).startOf("day");
  const end = dayjs(deliveryDate).endOf("day");
  const todayDeliveries = await RentDelivery.find({
    date: { $gte: start, $lt: end },
  });
  return todayDeliveries.length + 1;
  
};

const getNextDeliveryTotalNumber = async () => {
  const totalDeliveries = await RentDelivery.find();
  return totalDeliveries.length + 1;
  
};


export async function changeRentPayDayData({ rentId, day, lastUpdatedBy }) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }

    const validStatuses = ["RENTADO", "EN_CAMBIO", "EN_RECOLECCION", "VENCIDA"];
    let rent = await Rent.findById(rentId).populate("status").exec();
    if (!validStatuses.includes(rent.status.id)) {
      error.message =
        "La renta indicada no esta disponible para el cambio de día";
      throw error;
    }
    const currentDay = format(new Date(rent.endDate), "eeee").toLowerCase();
    const list = Object.keys(WEEK_DAYS);
    const currentIndex = list.indexOf(currentDay);
    const newIndex = list.indexOf(day);
    if (!WEEK_DAYS[day] || newIndex == currentIndex) {
      error.message =
        "El día indicado no esta disponible para el cambio de día";
      throw error;
    }
    let customer = await Customer.findById(rent.customer).populate("level").exec();
    const dayDiff =
      newIndex > currentIndex
        ? newIndex - currentIndex
        : list.length - (currentIndex - newIndex);
    customer.acumulatedDays = customer.acumulatedDays + dayDiff;
    rent.acumulatedDays = rent.acumulatedDays + dayDiff;
    if (rent.acumulatedDays > 4) {
      rent.totalWeeks = rent.totalWeeks + 1;
      rent.acumulatedDays =
        rent.acumulatedDays > 7 ? rent.acumulatedDays - 7 : 0;
    }
    const newEndDate = addDaysToDate(new Date(rent.endDate), dayDiff);
    rent.endDate = newEndDate;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });
    if (customer.acumulatedDays > 4) {
      customer.totalRentWeeks = customer.totalRentWeeks + 1;
      customer.acumulatedDays =
        customer.acumulatedDays > 7 ? customer.acumulatedDays - 7 : 0;
    }

    let { dayPrice } = customer.level;
    const daysCost = dayDiff * dayPrice;
    let newBalance = customer.balance;

    const debt = customer.balance - daysCost;
    if (debt < 0) {
      newBalance = debt;
      if (daysCost >= 4 * dayPrice && customer.freeWeeks > 0) {
        customer.freeWeeks = customer.freeWeeks - 1;
        newBalance = customer.balance;
      }
    } else {
      newBalance = newBalance - daysCost;
    }
    const localeWeekDay = capitalizeFirstLetter(
      format(newEndDate, "eeee", {
        locale: es,
      })
    );
    const changePayMov = await new CustomerMovement({
      customer,
      rent,
      type: "PAY_CHANGE",
      description: `Día de pago cambiado al ${localeWeekDay}`,
      date: currentDate,
    }).save({ session, new: true });
    customer.balance = newBalance;
    customer.movements.push(changePayMov);
    customer.payDayChanged = true;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrío un error al guardar el día de pago. Intente de nuevo."
      );
    }
  }
}

export async function extendRentData({ rentId, rentPeriod, lastUpdatedBy }) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    const { selectedWeeks, useFreeWeeks } = rentPeriod;
    const rent = await Rent.findById(rentId);
    if (!rent) {
      error.message = "La renta indicada no existe";
      throw error;
    }
    let customer = await Customer.findById(rent.customer)
      .populate("level")
      .exec();
    const { weekPrice } = customer.level;
    const toPay =
      (selectedWeeks - (useFreeWeeks ? customer.freeWeeks : 0)) * weekPrice;
    const hasBalance =
      customer.balance >= toPay || customer.balance + toPay === 0 || toPay <= 0;
    if (!hasBalance) {
      error.message =
        "El cliente no cuenta con saldo suficiente, favor de agregar un pago nuevo";
      throw error;
    }
    let usedFreeWeeks = 0;
    if (useFreeWeeks) {
      usedFreeWeeks =
        selectedWeeks >= customer.freeWeeks
          ? customer.freeWeeks
          : selectedWeeks;
    }
    rent.usedFreeWeeks = rent.usedFreeWeeks + usedFreeWeeks;
    rent.endDate = addDaysToDate(new Date(rent.endDate), selectedWeeks * 7);
    rent.extendedTimes = rent.extendedTimes + 1;
    rent.totalWeeks = rent.totalWeeks + 1;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    const rentExtMovement = await new CustomerMovement({
      customer,
      rent,
      type: "EXT_RENT",
      description: `Renta extendida ${selectedWeeks} semana(s)`,
      date: currentDate,
    }).save({ session, new: true });

    let level = customer.level;
    if (level.id === "nuevo") {
      level = await CustomerLevel.findOne({ id: "regular" });
    }
    if (level.id === "regular") {
      if (rent.totalWeeks >= 8)
        level = await CustomerLevel.findOne({ id: "permanente" });
    }
    customer.level = level._id;
    customer.movements.push(rentExtMovement._id);
    customer.freeWeeks = customer.freeWeeks - usedFreeWeeks;
    customer.totalRentWeeks = customer.totalRentWeeks + 1;
    const newBalance =
      toPay > 0 && customer.balance + toPay !== 0
        ? customer.balance - toPay
        : customer.balance;
    customer.balance = newBalance;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({ session, new: false });
    let machine = await Machine.findById(rent.machine);

    const rentExtMachineMovement = await new MachineMovement({
      machine,
      type: MACHINE_MOVEMENT_LIST.EXT_RENT,
      description:
        `Extensión de renta ${selectedWeeks} semana(s)` +
        (usedFreeWeeks > 0 ? ` (${usedFreeWeeks} sem. gratis)` : ""),
      amount: toPay >= 0 ? toPay : 0,
      date: currentDate,
    }).save({ session, new: true });
    machine.movements.push(rentExtMachineMovement._id);
    machine.earnings = machine.earnings + (toPay >= 0 ? toPay : 0);
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrío un error al guardar la renta. Intente de nuevo."
      );
    }
  }
}
export async function getRentByIdData(rentId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const rent = await Rent.findById(rentId)
    .lean()
    .populate([
      {
        path: "customer",
        populate: ["currentResidence", "level"],
      },
      "machine",
    ])
    .exec();
  let totalWeeks =
    rent?.totalWeeks > 0
      ? rent.totalWeeks
      : dateDiffInWeeks(new Date(rent.startDate), new Date(Date.now()));
  rent.totalWeeks = totalWeeks;
  let customerWeeks =
    rent?.customer.totalRentWeeks > 0
      ? rent?.customer.totalRentWeeks
      : dateDiffInWeeks(new Date(rent.startDate), new Date(Date.now()));
  rent.totalWeeks = totalWeeks;
  rent.customer.totalRentWeeks = customerWeeks;

  rent.remaining = dateDiffInDays(new Date(Date.now()), new Date(rent.endDate));
  return rent;
}
export async function saveRentData({
  customerId,
  rentPeriod,
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
    // Check if the customer  does not have a current rent
    let customer = await Customer.findById(customerId)
      .populate(["level","currentResidence"])
      .exec();
    if (!customer || customer.hasRent) {
      error.message = "El cliente indicado no es válido";
      throw error;
    }
    // Create Rent
    const rentStatus = await RentStatus.findOne({ id: "PENDIENTE" });
    const { weekPrice } = customer.level;
    let weeksToPay = rentPeriod.selectedWeeks;
    if (customer.freeWeeks > 0 && rentPeriod.useFreeWeeks) {
      weeksToPay =
        customer.freeWeeks <= rentPeriod.selectedWeeks
          ? rentPeriod.selectedWeeks - customer.freeWeeks
          : 0;
    }
    let usedFreeWeeks = 0;
    if (rentPeriod.useFreeWeeks) {
      usedFreeWeeks =
        rentPeriod.selectedWeeks >= customer.freeWeeks
          ? customer.freeWeeks
          : rentPeriod.selectedWeeks;
    }

    const initialPay = weeksToPay * weekPrice;
    let rent = await new Rent({
      status: rentStatus,
      customer,
      usedFreeWeeks,
      initialWeeks: rentPeriod.selectedWeeks,
      initialPay,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy,
    }).save({ session, new: true });

    customer.hasRent = true;
    customer.currentRent = rent._id;
    await customer.save({ session, new: false });
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
    // Get next delivery number (by current day)
    const totalNumber = await getNextDeliveryTotalNumber();
    // Get next delivery number (by current day)
    const dayNumber = await getNextDeliveryDayNumber(new Date(deliveryTime.date));
    const delivery = await new RentDelivery({
      totalNumber,
      dayNumber,
      rent,
      date,
      timeOption: deliveryTime.timeOption,
      fromTime,
      endTime,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });
    await session.commitTransaction();
    await session.endSession();
    return {rent, delivery};
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrío un error al guardar la renta. Intente de nuevo."
      );
    }
  }
}

export async function getPendingRentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingRents = await RentDelivery.find({
    status: { $in: ["ESPERA", "EN_CAMINO"] },
  })
    .populate("rent")
    .sort({ date: 1 })
    .exec();
  return pendingRents;
}

export async function getRentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let validStatuses = await RentStatus.find({
    id: { $in: ["RENTADO", "EN_CAMBIO", "EN_RECOLECCION", "VENCIDA"] },
  });
  let validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);
  let current = await Rent.find({ status: { $in: validIds } })
    .lean()
    .populate(["customer", "status", "machine"])
    .sort({ endDate: 1 })
    .exec();

  validStatuses = await RentStatus.find({
    id: { $in: ["FINALIZADA", "CANCELADA"] },
  });
  validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);
  for (let index in current) {
    const endDate = current[index].endDate;
    current[index].remaining = dateDiffInDays(
      new Date(Date.now()),
      new Date(endDate)
    );
  }
  const past = await Rent.find({ status: { $in: validIds }, num: { $gt: 0} })
    .populate(["customer", "status", "machine"])
    .sort({ endDate: -1 })
    .exec();
  return { current, past };
}

export async function getRentsWithLocations() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const validStatuses = await RentStatus.find({
    id: { $in: ["RENTADO", "EN_CAMBIO", "EN_RECOLECCION", "VENCIDA"] },
  });
  const validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);
  const currentRents = await Rent.find({ status: { $in: validIds } })
    .populate([
      {
        path: "customer",
        model: "customers",
        populate: {
          path: "currentResidence",
          model: "residences",
        },
      },
      {
        path: "machine",
        model: "machines",
      },
    ])
    .exec();
  return currentRents;
}
