import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import { RentPickup } from "../models/RentPickup";
import { RentChange } from "../models/RentChange";
import {
  getTimeFromDate,
  getFileExtension,
  addDaysToDate,
  setDateToInitial,
  validateMapsUrl,
  setDateToEnd,
  isDateInRange,
} from "../client/utils";
import dayjs from "dayjs";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Residence } from "../models/Residence";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { MachineMovement } from "../models/MachineMovement";
import { Vehicle } from "../models/Vehicle";
import { CustomerLevel } from "../models/CustomerLevel";
import { CustomerMovement } from "../models/CustomerMovement";
import { Payment } from "../models/Payment";
import { updateResidenceDataFunc } from "./Customers";
import { MACHINE_MOVEMENT_LIST, PAYMENT_METHODS } from "../consts/OBJ_CONTS";
import { uploadFile } from "../cloud";
import { City } from "../models/City";
import { Sector } from "../models/Sector";
import { format } from "date-fns";
import { ConnectingAirportsOutlined } from "@mui/icons-material";
import es from "date-fns/locale/es";

export async function getSummaryByDay(date) {
  const startDate = setDateToInitial(date);
  const endDate = setDateToEnd(date);
  const _1stDayMonth = dayjs(startDate).startOf("month");
  const _lastDayMonth = dayjs(startDate).endOf("month");

  let result = {
    deliveries: {
      dayTotal: 0,
      monthTotal: 0,
    },
    pickups: {
      dayTotal: 0,
      monthTotal: 0,
    },
    changes: {
      dayTotal: 0,
      monthTotal: 0,
    },
    customers: {
      dayTotal: 0,
      monthTotal: 0,
    },
    payments: {
      dayTotal: 0,
      monthTotal: 0,
    },
  };

  // Deliveries
  const monthDeliveries = await RentDelivery.find({
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  });
  const dayDeliveries = monthDeliveries.filter((delivery) =>
    isDateInRange(delivery.date, startDate, endDate)
  );
  result.deliveries.monthTotal = monthDeliveries.length;
  result.deliveries.dayTotal = dayDeliveries.length;

  // Pickups
  const monthPickups = await RentPickup.find({
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  });
  const dayPickups = monthPickups.filter((pickup) =>
    isDateInRange(pickup.finishedAt, startDate, endDate)
  );
  result.pickups.monthTotal = monthPickups.length;
  result.pickups.dayTotal = dayPickups.length;

  // Changes
  const monthChanges = await RentChange.find({
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  });
  const dayChanges = monthChanges.filter((change) =>
    isDateInRange(change.finishedAt, startDate, endDate)
  );
  result.changes.monthTotal = monthChanges.length;
  result.changes.dayTotal = dayChanges.length;

  // Customers
  const monthCustomers = await Customer.find({
    createdAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  });
  const dayCustomers = monthCustomers.filter((customer) =>
    isDateInRange(customer.createdAt, startDate, endDate)
  );
  result.customers.monthTotal = monthCustomers.length;
  result.customers.dayTotal = dayCustomers.length;

  // Payments
  const monthPayments = await Payment.find({
    date: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    method: { $in: ["DEP", "TRANSFER", "CASH_OFFICE"] },
  });
  const dayPayments = monthPayments.filter((payment) =>
    isDateInRange(payment.date, startDate, endDate)
  );
  result.payments.monthTotal = monthPayments.length;
  result.payments.dayTotal = dayPayments.length;
  return result;
}

export async function getSummaryByWeek(start, end) {
  const startDate = setDateToInitial(start);
  const endDate = setDateToEnd(end);

  let currentDate = setDateToEnd(new Date());
  if (currentDate.getTime() >= endDate.getTime()) {
    currentDate = endDate;
  }

  let result = {
    deliveries: {
      totalData: {
        sent: 0,
        done: 0,
      },
      days: [],
    },
    pickups: {
      totalData: {
        sent: 0,
        done: 0,
      },
      days: [],
    },
    changes: {
      totalData: {
        sent: 0,
        done: 0,
      },
      days: [],
    },
    customers: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    payments: {
      totalData: {
        done: 0,
      },
      days: [],
    },
  };
  let defaultDays = {};
  let defaultDaysBak = {};
  let countDate = startDate;
  while (isDateInRange(countDate, startDate, endDate)) {
    const formatted = format(countDate, "dd/MM/yyyy");
    defaultDays[formatted] = {
      date: countDate,
      weekDay: format(countDate, "eeee", {
        locale: es,
      }),
      sent: 0,
      done: 0,
    };
    countDate = addDaysToDate(countDate, 1);
  }
  defaultDaysBak = { ...defaultDays };
  // Deliveries
  // Sent but not delivered updatedAt and status not "ENTREGADA"
  // done = finishedAt and status == "ENTREGADA"
  const notDeliveried = await RentDelivery.find({
    status: { $ne: "ENTREGADA" },
    wasSent: true,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const doneDeliveries = await RentDelivery.find({
    status: "ENTREGADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  for (const i in notDeliveried) {
    const delivery = notDeliveried[i];
    const formatted = format(delivery?.date, "dd/MM/yyyy");
    defaultDays[formatted] = {
      ...defaultDays[formatted],
      sent: defaultDays[formatted].sent + 1,
    };
  }

  for (const i in doneDeliveries) {
    const delivery = doneDeliveries[i];
    const formatted = format(delivery?.finishedAt, "dd/MM/yyyy");
    defaultDays[formatted] = {
      ...defaultDays[formatted],
      sent: defaultDays[formatted].sent + 1,
      done: defaultDays[formatted].done + 1,
    };
  }
  result.deliveries.days = Object.values(defaultDays);
  result.deliveries.totalData.sent =
    notDeliveried.length + doneDeliveries.length;
  result.deliveries.totalData.done = doneDeliveries.length;

  defaultDays = {...defaultDaysBak};

  // Changes
  // Sent but not changed updatedAt and status not "FINALIZADO"
  // done = finishedAt and status == "FINALIZADO"
  const notChanged = await RentChange.find({
    status: { $ne: "FINALIZADO" },
    wasSent: true,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const doneChanges = await RentChange.find({
    status: "FINALIZADO",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  for (const i in notChanged) {
    const change = notChanged[i];
    const formatted = format(change?.date, "dd/MM/yyyy");
    defaultDays[formatted] = {
      ...defaultDays[formatted],
      sent: defaultDays[formatted].sent + 1,
    };
  }

  for (const i in doneChanges) {
    const change = doneChanges[i];
    const formatted = format(change?.finishedAt, "dd/MM/yyyy");
    defaultDays[formatted] = {
      ...defaultDays[formatted],
      sent: defaultDays[formatted].sent + 1,
      done: defaultDays[formatted].done + 1,
    };
  }
  result.changes.days = Object.values(defaultDays);
  result.changes.totalData.sent = notChanged.length + doneChanges.length;
  result.changes.totalData.done = doneChanges.length;

  defaultDays = {...defaultDaysBak};
  // Pickups
  // Sent but not changed picked and status not "FINALIZADO"
  // done = finishedAt and status == "FINALIZADO"
  const notPicked = await RentPickup.find({
    status: { $ne: "RECOLECTADA" },
    wasSent: true,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
  const donePickups = await RentPickup.find({
    status: "RECOLECTADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
  for (const i in notPicked) {
    const pickup = notPicked[i];
    const formatted = format(pickup?.date, "dd/MM/yyyy");
    defaultDays[formatted] = {
      ...defaultDays[formatted],
      sent: defaultDays[formatted].sent + 1,
    };
  }

  for (const i in donePickups) {
    const pickup = donePickups[i];
    const formatted = format(pickup?.finishedAt, "dd/MM/yyyy");
    defaultDays[formatted] = {
      ...defaultDays[formatted],
      sent: defaultDays[formatted].sent + 1,
      done: defaultDays[formatted].done + 1,
    };
  }
  result.pickups.days = Object.values(defaultDays);
  result.pickups.totalData.sent = notPicked.length + donePickups.length;
  result.pickups.totalData.done = donePickups.length;

  return result;

  // Customers
  const monthCustomers = await Customer.find({
    createdAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  });
  const dayCustomers = monthCustomers.filter((customer) =>
    isDateInRange(customer.createdAt, startDate, endDate)
  );
  result.customers.monthTotal = monthCustomers.length;
  result.customers.dayTotal = dayCustomers.length;

  // Payments
  const monthPayments = await Payment.find({
    date: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    method: { $in: ["DEP", "TRANSFER"] },
  });
  const dayPayments = monthPayments.filter((payment) =>
    isDateInRange(payment.date, startDate, endDate)
  );
  result.payments.monthTotal = monthPayments.length;
  result.payments.dayTotal = dayPayments.length;
  return result;
}