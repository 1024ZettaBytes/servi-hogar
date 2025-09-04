import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { CurrentRentsLog } from '../models/CurrentRentsLog';
import { Customer } from '../models/Customer';
import { Machine } from '../models/Machine';
import { MachineStatus } from '../models/MachineStatus';
import { Payout } from '../models/Payout';
import { Rent } from '../models/Rent';
import { RentDelivery } from '../models/RentDelivery';
import { RentStatus } from '../models/RentStatus';
import { Residence } from '../models/Residence';

import { Role } from '../models/Role';
import { savePickupData } from './Pickups';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import dayjs from 'dayjs';
import * as str from 'string';
import {
  addDaysToDate,
  capitalizeFirstLetter,
  dateDiffInDays,
  dateDiffInWeeks,
  dateToPlainString,
  formatTZDate,
  getTimeFromDate,
  machineCalculations,
  setDateToMid,
  setDateToEnd
} from '../client/utils';
import {
  MACHINE_MOVEMENT_LIST,
  PAYOUT_KEYS,
  WEEK_DAYS
} from '../consts/OBJ_CONTS';
import { City } from '../models/City';
import { CustomerLevel } from '../models/CustomerLevel';
import { CustomerMovement } from '../models/CustomerMovement';
import { MachineMovement } from '../models/MachineMovement';
import { Partner } from '../models/Partner';
import { Sector } from '../models/Sector';
import { getPricesData } from './Prices';
MachineStatus.init();
Machine.init();
Sector.init();
City.init();
Residence.init();
CurrentRentsLog.init();

const getNextDeliveryDayNumber = async (deliveryDate) => {
  const start = dayjs(deliveryDate).startOf('day');
  const end = dayjs(deliveryDate).endOf('day');
  const todayDeliveries = await RentDelivery.find({
    date: { $gte: start, $lt: end },
    status: { $ne: 'REPROGRAMADO' }
  });
  return todayDeliveries.length + 1;
};

const getNextDeliveryTotalNumber = async () => {
  const totalDeliveries = await RentDelivery.countDocuments({
    status: { $ne: 'REPROGRAMADO' }
  });
  return totalDeliveries + 1;
};
export async function createPickupsForRents() {
  const onRentStatus = await RentStatus.findOne({ id: 'RENTADO' });
  const yesterdayDate = setDateToEnd(new Date()).setDate(
    new Date().getDate() - 1
  );
  const rentsToPickup = await Rent.find({
    status: onRentStatus._id,
    endDate: { $lte: yesterdayDate }
  });
  const rentsWithDiff = rentsToPickup.filter(
    (rent) =>
      dateDiffInDays(new Date(rent.startDate), new Date(rent.endDate)) < 30
  );
  if (rentsWithDiff.length === 0) {
    console.log('INFO: No hay rentas a recoger con menos de 30 días.');
    return;
  }
  console.log(
    'INFO: Rentas a recoger con menos de 30 días: ',
    rentsWithDiff.length
  );
  const systemRole = await Role.findOne({ id: 'SYSTEM' });
  for (let rent of rentsWithDiff) {
    await savePickupData({
      rentId: rent._id,
      lastUpdatedBy: systemRole._id,
      reason: 'SISTEMA: vencida',
      pickupTime: {
        date: setDateToMid(new Date()),
        timeOption: 'any'
      }
    });
    console.log('Recogida programada para la renta: ', rent.num);
  }
}
export async function generateCurrentRentLogData() {
  try {
    const currentDate = setDateToMid(new Date());
    const dateText = dateToPlainString(addDaysToDate(currentDate, -1));
    console.log(new Date().toString());
    console.log('Mid date of executed time: ', currentDate.toString());
    console.log('TEXT to save on DB: ', dateText);
    if (!isConnected()) {
      await connectToDatabase();
    }
    let validStatuses = await RentStatus.find({
      id: { $in: ['RENTADO', 'EN_CAMBIO', 'VENCIDA', 'EN_RECOLECCION'] }
    });
    let validIds = validStatuses.reduce((prev, curr) => {
      prev.push(curr._id);
      return prev;
    }, []);
    const amount = await Rent.countDocuments({
      status: { $in: validIds }
    }).lean();
    let newLog = new CurrentRentsLog({
      dateText,
      amount
    });
    await newLog.save({ isNew: true });
  } catch (e) {
    console.error(e);
    throw new Error('Ocurrío un error al registrar las rentas actuales.');
  }
}
export async function changeRentPayDayData({ rentId, day, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }

    const validStatuses = ['RENTADO', 'EN_CAMBIO', 'EN_RECOLECCION', 'VENCIDA'];
    let rent = await Rent.findById(rentId).populate('status').exec();
    if (!validStatuses.includes(rent.status.id)) {
      error.message =
        'La renta indicada no esta disponible para el cambio de día';
      throw error;
    }
    const currentDay = formatTZDate(
      new Date(rent.endDate),
      'dddd'
    ).toLowerCase();
    const list = Object.keys(WEEK_DAYS);
    const currentIndex = list.indexOf(str(currentDay).latinise().toString());
    const newIndex = list.indexOf(day);
    if (!WEEK_DAYS[day] || newIndex == currentIndex) {
      error.message =
        'El día indicado no esta disponible para el cambio de día';
      throw error;
    }
    let customer = await Customer.findById(rent.customer)
      .populate('level')
      .exec();
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
      format(newEndDate, 'eeee', {
        locale: es
      })
    );
    const changePayMov = await new CustomerMovement({
      customer,
      rent,
      machine: rent.machine,
      type: 'PAY_CHANGE',
      description: `Día de pago cambiado al ${localeWeekDay}`,
      date: currentDate
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
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrío un error al guardar el día de pago. Intente de nuevo.'
      );
    }
  }
}

export async function extendRentData({ rentId, rentPeriod, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const { selectedWeeks, useFreeWeeks } = rentPeriod;
    const rent = await Rent.findById(rentId);
    if (!rent) {
      error.message = 'La renta indicada no existe';
      throw error;
    }
    let customer = await Customer.findById(rent.customer)
      .populate('level')
      .exec();
    const { weekPrice } = customer.level;
    const toPay =
      (selectedWeeks - (useFreeWeeks ? customer.freeWeeks : 0)) * weekPrice;
    const hasBalance =
      customer.balance >= toPay || customer.balance + toPay === 0 || toPay <= 0;
    if (!hasBalance) {
      error.message =
        'El cliente no cuenta con saldo suficiente, favor de agregar un pago nuevo';
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
    rent.totalWeeks = rent.totalWeeks + selectedWeeks;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    let machine = await Machine.findById(rent.machine);
    await session.startTransaction();
    await rent.save({ session, new: false });

    const rentExtMovement = await new CustomerMovement({
      customer,
      rent,
      machine: rent.machine,
      type: 'EXT_RENT',
      description: `Renta extendida ${selectedWeeks} semana(s)`,
      date: currentDate
    }).save({ session, new: true });

    let level = customer.level;
    if (level.id === 'nuevo') {
      level = await CustomerLevel.findOne({ id: 'regular' });
    }
    /*if (level.id === "regular") {
      if (rent.totalWeeks >= 8)
        level = await CustomerLevel.findOne({ id: "permanente" });
    }*/
    customer.level = level._id;
    customer.movements.push(rentExtMovement._id);
    customer.freeWeeks = customer.freeWeeks - usedFreeWeeks;
    customer.totalRentWeeks = customer.totalRentWeeks + selectedWeeks;
    const newBalance =
      toPay > 0 && customer.balance + toPay !== 0
        ? customer.balance - toPay
        : customer.balance;
    customer.balance = newBalance;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({ session, new: false });

    const rentExtMachineMovement = await new MachineMovement({
      machine,
      type: MACHINE_MOVEMENT_LIST.EXT_RENT,
      description:
        `Extensión de renta ${selectedWeeks} semana(s)` +
        (usedFreeWeeks > 0 ? ` (${usedFreeWeeks} sem. gratis)` : ''),
      amount: toPay >= 0 ? toPay : 0,
      date: currentDate
    }).save({ session, new: true });
    machine.movements.push(rentExtMachineMovement._id);
    machine.earnings = machine.earnings + (toPay >= 0 ? toPay : 0);
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });
    if (machine.partner) {
      const incomeAmount = selectedWeeks * weekPrice;
      const {
        mantainance,
        mantPercentage,
        comision,
        comisionPercentage,
        toPay
      } = machineCalculations(incomeAmount, currentDate, machine.createdAt);
      let currentPartner = await Partner.findById(machine.partner);

      const newPayout = await new Payout({
        type: PAYOUT_KEYS.EXTENDED,
        incomeAmount,
        mantainance,
        mantainancePercentage: mantPercentage,
        comision,
        comisionPercentage,
        toPay,
        machine: machine._id,
        partner: machine.partner,
        createdAt: currentDate,
        lastUpdatedBy: lastUpdatedBy
      }).save({ session, isNew: true });
      currentPartner.payouts.push(newPayout);
      await currentPartner.save({ session, isNew: false });
    }
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
      console.error(e);
      throw new Error(
        'Ocurrío un error al guardar la renta. Intente de nuevo.'
      );
    }
  }
}

export async function addRentBonusData({
  rentId,
  selectedDays,
  reason,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    if (selectedDays <= 0 || reason.trim().length <= 0) {
      error.message = 'Los datos recibidos no son válidos';
      throw error;
    }
    const rent = await Rent.findById(rentId).populate('status').exec();
    if (!rent) {
      error.message = 'La renta indicada no existe';
      throw error;
    }
    if (['EN_CAMBIO', 'EN_RECOLECCION'].includes(rent.status.id)) {
      error.message = 'La renta indicada no tiene un estado válido';
      throw error;
    }

    const newEndDate = addDaysToDate(rent.endDate, selectedDays);
    rent.endDate = newEndDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    rent.updatedAt = currentDate;
    await rent.save({ session, new: false });

    let customer = await Customer.findById(rent.customer);

    const rentBonusMovement = await new CustomerMovement({
      customer,
      rent,
      machine: rent.machine,
      type: 'BONUS',
      description: `Bonificación ${selectedDays} día(s): ${reason}`,
      date: currentDate
    }).save({ session, new: true });
    customer.movements.push(rentBonusMovement);
    await customer.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrío un error al guardar la bonificación. Intente de nuevo.'
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
        path: 'customer',
        populate: ['currentResidence', 'level']
      },
      'machine'
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
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    // Check if the customer  does not have a current rent
    let customer = await Customer.findById(customerId)
      .populate(['level', 'currentResidence'])
      .exec();
    if (!customer || customer.hasRent) {
      error.message = 'El cliente indicado no es válido';
      throw error;
    }
    // Create Rent
    const rentStatus = await RentStatus.findOne({ id: 'PENDIENTE' });
    const { newWeekPrice, twoWeekPrice, threeWeekPrice } =
      await getPricesData();
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

    let initialPay = 0;
    switch (weeksToPay) {
      case 1:
        initialPay = newWeekPrice;
        break;
      case 2:
        initialPay = twoWeekPrice;
        break;
      case 3:
        initialPay = threeWeekPrice;
    }
    const initialWeeks =
      rentPeriod.selectedWeeks == 3 && rentPeriod.usePromo
        ? 4
        : rentPeriod.selectedWeeks;
    let rent = await new Rent({
      status: rentStatus,
      customer,
      usedFreeWeeks,
      initialWeeks,
      initialPay,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy
    }).save({ session, new: true });

    customer.hasRent = true;
    customer.currentRent = rent._id;
    await customer.save({ session, new: false });

    let date = new Date(deliveryTime.date);
    let fromTime = new Date(deliveryTime.date);
    let endTime = new Date(deliveryTime.date);
    if (deliveryTime.timeOption === 'any') {
      date.setHours(21, 59, 59, 0);
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
    const dayNumber = await getNextDeliveryDayNumber(
      new Date(deliveryTime.date)
    );
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
      createdBy: lastUpdatedBy,
      lastUpdatedBy,
      wasSent: true
    }).save({ session, new: true });
    let lastRent = null;
    if (customer.totalRentWeeks > 0) {
      lastRent = await Rent.findOne({ customer: customer._id, num: { $gt: 0 } })
        .select({ startDate: 1, num: 1 })
        .sort({ startDate: -1 })
        .lean();
    }
    lastRent = lastRent?.startDate;
    await session.commitTransaction();
    await session.endSession();
    return { rent, delivery, lastRent };
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrío un error al guardar la renta. Intente de nuevo.'
      );
    }
  }
}

export async function getRentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let validStatuses = await RentStatus.find({
    id: { $in: ['RENTADO', 'EN_CAMBIO', 'VENCIDA'] }
  });
  let validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);
  let current = await Rent.find({ status: { $in: validIds } })
    .select({
      _id: 1,
      num: 1,
      status: 1,
      endDate: 1,
      machine: 1,
      customer: 1,
      startDate: 1
    })
    .populate([
      {
        path: 'status',
        select: 'id',
        model: 'rent_statuses'
      },
      {
        path: 'machine',
        select: 'machineNum',
        model: 'machines'
      },
      {
        path: 'customer',
        select: '_id name currentResidence maxPayDays',
        model: 'customers',
        populate: {
          path: 'currentResidence',
          select: 'city sector suburb',
          populate: [
            { path: 'city', select: 'name' },
            { path: 'sector', select: 'name' }
          ]
        }
      }
    ])
    .lean();
  
  for (let index in current) {
    const { startDate, endDate } = current[index];
    current[index].remaining = dateDiffInDays(
      new Date(Date.now()),
      new Date(endDate)
    );
    current[index].totalDays = dateDiffInDays(
      new Date(startDate),
      new Date(Date.now())
    );
  }
  current.sort((a, b) => {
    if(a.remaining != b.remaining) return (a.remaining > b.remaining ? 1 : -1);
    return a.customer.name.localeCompare(b.customer.name);
  });
  return current;
}

export async function getPastRentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let validStatuses = await RentStatus.find({
    id: { $in: ['FINALIZADA', 'CANCELADA'] }
  });
  const validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);

  const past = await Rent.find({ status: { $in: validIds }, num: { $gt: 0 } })
    .populate([
      {
        path: 'status',
        select: 'id',
        model: 'rent_statuses'
      },
      {
        path: 'machine',
        select: 'machineNum',
        model: 'machines'
      },
      {
        path: 'customer',
        select: '_id name',
        model: 'customers'
      }
    ])
    .sort({ endDate: -1 })
    .lean();
  return past;
}
export async function getRentsWithLocations() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const validStatuses = await RentStatus.find({
    id: { $in: ['RENTADO', 'EN_CAMBIO', 'EN_RECOLECCION', 'VENCIDA'] }
  });
  const validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);
  const currentRents = await Rent.find({ status: { $in: validIds } })
    .populate([
      {
        path: 'customer',
        model: 'customers',
        populate: {
          path: 'currentResidence',
          model: 'residences'
        }
      },
      {
        path: 'machine',
        model: 'machines'
      }
    ])
    .exec();
  return currentRents;
}
export async function getLastRentByCustomerId(customerId) {
  return await Rent.findOne({ customer: customerId, num: { $gt: 0 } })
    .select({ startDate: 1, num: 1, imagesUrl: 1 })
    .sort({ startDate: -1 })
    .lean();
}
/*export async function fixRentData({
  arrData,
  //machineNum,
  //customerName,
  //nextPayDate,
}) {
  let error = new Error();
  error.name = "Internal";
  console.log("starting session");
  const session = await mongoose.startSession();
  console.log("starting transaction");
  await session.startTransaction();
  console.log("gonna try");

  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    for (let i = 100; i < 150; i++) {
      console.log(i, "--------------------");

      const { machineNum, customerName, nextPayDate } = arrData[i];
      console.log("searching machine");
      const machine = await Machine.findOne({ machineNum }).populate("status");
      if (!machine || machine.status.id !== "RENTADO") {
        error.message =
          "El equipo indicado no esta en la renta indicada: " + machineNum;
        throw error;
      }
      console.log("searching rent");
      let rent = await Rent.findById(machine.lastRent);
      if (!rent) {
        error.message = "La renta indicada no existe";
        throw error;
      }

      let customer = await Customer.findById(rent.customer);
      customer.name;

      if (
        !str(customer.name.toLowerCase())
          .latinise()
          .includes(str(customerName.toLowerCase()).latinise())
      ) {
        error.message =
          "El nombre del cliente no coincide: " +
          customer.name +
          ", machine: " +
          machineNum;
        throw error;
      }
      const dateData = nextPayDate.split("/");
      const d = parseInt(dateData[0]);
      const m = parseInt(dateData[1]);
      const y = parseInt(dateData[2]);
      let endDate = new Date(y, m - 1, d);
      endDate = setDateToEnd(endDate);
      console.log(rent.startDate.toISOString());
      console.log(endDate.toISOString());

      rent.endDate = endDate;
      console.log(machineNum);
      console.log(customerName);
      console.log(nextPayDate);
      const totalWeeks = dateDiffInWeeks(endDate, rent.startDate);
      console.log("Total weeks: ", totalWeeks);
      rent.totalWeeks = totalWeeks;
      rent.isNew = false;
      await rent.save({ session, new: false });

      customer.totalRentWeeks = totalWeeks;
      let levelId =
        totalWeeks < 4 ? "nuevo" : totalWeeks < 8 ? "regular" : "permanente";
      let level = await CustomerLevel.findOne({ id: levelId });
      console.log(level.name);
      customer.level = level;
      customer.isNew = false;
      await customer.save({ session, new: false });
      console.log("--------------------");
    }
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
}*/
