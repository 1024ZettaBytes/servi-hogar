import { RentDelivery } from "../models/RentDelivery";
import { RentPickup } from "../models/RentPickup";
import { RentChange } from "../models/RentChange";
import {
  addDaysToDate,
  setDateToInitial,
  setDateToEnd,
  isDateInRange,
  setDateToMid,
  dateFromString,
  getFirstWeekDay,
  getLastWeekDay,
  capitalizeFirstLetter,
} from "../client/utils";
import dayjs from "dayjs";

import { Customer } from "../models/Customer";
import { Payment } from "../models/Payment";
import { HOW_FOUND_LIST } from "../consts/OBJ_CONTS";
import { format } from "date-fns";
import es from "date-fns/locale/es";
function getAggregateProfit(startDate, endDate){
  return[
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        SUM: {
          $sum: "$amount",
        },
        COUNT: {
          $sum: 1,
        },
      },
    },
  ]
}
export async function getSummaryByDay(date) {
  const startDate = setDateToInitial(dateFromString(date));
  const endDate = setDateToEnd(startDate);
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
    isDateInRange(delivery.finishedAt, startDate, endDate)
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
    firstRentAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    howFound: { $ne: "old" },
  });
  const dayCustomers = monthCustomers.filter((customer) =>
    isDateInRange(customer.firstRentAt, startDate, endDate)
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

export async function getSummaryByRange(start, end) {
  const startDate = setDateToInitial(dateFromString(start));
  const endDate = setDateToEnd(dateFromString(end));

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
        howFound: {},
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
  let countDate = startDate;
  let howFound = {};
  Object.keys(HOW_FOUND_LIST).forEach((key) => {
    howFound[key] = 0;
  });
  result.customers.totalData.howFound = howFound;
  countDate = setDateToMid(countDate);
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
  ///console.log("Default days ", defaultDays);
  // Deliveries
  // Sent but not delivered updatedAt and status not "ENTREGADA"
  // done = finishedAt and status == "ENTREGADA"
  let defaultDaysDlv = structuredClone(defaultDays);

  const notDeliveried = await RentDelivery.find({
    status: { $ne: "ENTREGADA" },
    wasSent: true,
    date: { $gte: startDate, $lte: endDate },
  });

  const doneDeliveries = await RentDelivery.find({
    status: "ENTREGADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  });

  for (const i in notDeliveried) {
    const delivery = notDeliveried[i];
    const formatted = format(delivery?.date, "dd/MM/yyyy");
    defaultDaysDlv[formatted] = {
      ...defaultDaysDlv[formatted],
      sent: defaultDaysDlv[formatted].sent + 1,
    };
  }

  for (const i in doneDeliveries) {
    const delivery = doneDeliveries[i];
    const formatted = format(delivery?.finishedAt, "dd/MM/yyyy");
    defaultDaysDlv[formatted] = {
      ...defaultDaysDlv[formatted],
      sent: defaultDaysDlv[formatted].sent + 1,
      done: defaultDaysDlv[formatted].done + 1,
    };
  }
  result.deliveries.days = Object.values(defaultDaysDlv);
  result.deliveries.totalData.sent =
    notDeliveried.length + doneDeliveries.length;
  result.deliveries.totalData.done = doneDeliveries.length;

  // Changes
  // Sent but not changed updatedAt and status not "FINALIZADO"
  // done = finishedAt and status == "FINALIZADO"
  let defaultDaysChange = structuredClone(defaultDays);
  const notChanged = await RentChange.find({
    status: { $ne: "FINALIZADO" },
    wasSent: true,
    date: { $gte: startDate, $lte: endDate },
  });

  const doneChanges = await RentChange.find({
    status: "FINALIZADO",
    finishedAt: { $gte: startDate, $lte: endDate },
  });

  for (const i in notChanged) {
    const change = notChanged[i];
    const formatted = format(change?.date, "dd/MM/yyyy");
    defaultDaysChange[formatted] = {
      ...defaultDaysChange[formatted],
      sent: defaultDaysChange[formatted].sent + 1,
    };
  }

  for (const i in doneChanges) {
    const change = doneChanges[i];
    const formatted = format(change?.finishedAt, "dd/MM/yyyy");
    defaultDaysChange[formatted] = {
      ...defaultDaysChange[formatted],
      sent: defaultDaysChange[formatted].sent + 1,
      done: defaultDaysChange[formatted].done + 1,
    };
  }
  result.changes.days = Object.values(defaultDaysChange);
  result.changes.totalData.sent = notChanged.length + doneChanges.length;
  result.changes.totalData.done = doneChanges.length;

  // Pickups
  // Sent but not changed picked and status not "FINALIZADO"
  // done = finishedAt and status == "FINALIZADO"
  let defaultDaysPick = structuredClone(defaultDays);
  const notPicked = await RentPickup.find({
    status: { $ne: "RECOLECTADA" },
    wasSent: true,
    date: { $gte: startDate, $lte: endDate },
  });
  const donePickups = await RentPickup.find({
    status: "RECOLECTADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  });
  for (const i in notPicked) {
    const pickup = notPicked[i];
    const formatted = format(pickup?.date, "dd/MM/yyyy");
    defaultDaysPick[formatted] = {
      ...defaultDaysPick[formatted],
      sent: defaultDaysPick[formatted].sent + 1,
    };
  }

  for (const i in donePickups) {
    const pickup = donePickups[i];
    const formatted = format(pickup?.finishedAt, "dd/MM/yyyy");
    defaultDaysPick[formatted] = {
      ...defaultDaysPick[formatted],
      sent: defaultDaysPick[formatted].sent + 1,
      done: defaultDaysPick[formatted].done + 1,
    };
  }
  result.pickups.days = Object.values(defaultDaysPick);
  result.pickups.totalData.sent = notPicked.length + donePickups.length;
  result.pickups.totalData.done = donePickups.length;

  // Customers
  // New customers using first rent and howFound not "old"
  let defaultDaysCust = structuredClone(defaultDays);
  Object.keys(defaultDaysCust).forEach((keyDay) => {
    defaultDaysCust[keyDay].howFound = structuredClone(howFound);
  });
  const newCustomers = await Customer.find({
    howFound: { $ne: "old" },
    firstRentAt: { $gte: startDate, $lte: endDate },
  });
  for (const i in newCustomers) {
    const customer = newCustomers[i];
    const formatted = format(customer?.firstRentAt, "dd/MM/yyyy");
    defaultDaysCust[formatted].done += 1;
    defaultDaysCust[formatted].howFound[customer.howFound] += 1;
    result.customers.totalData.howFound[customer.howFound] += 1;
  }
  result.customers.days = Object.values(defaultDaysCust);
  result.customers.totalData.done = newCustomers.length;

  // Payments
  // New payments using date and method in ["DEP", "TRANSFER", "CASH_OFFICE"]
  let defaultDaysPay = structuredClone(defaultDays);
  const newPayments = await Payment.find({
    method: { $in: ["DEP", "TRANSFER", "CASH_OFFICE"] },
    date: { $gte: startDate, $lte: endDate },
  });

  for (const i in newPayments) {
    const payment = newPayments[i];
    const formatted = format(payment?.date, "dd/MM/yyyy");
    defaultDaysPay[formatted] = {
      ...defaultDaysPay[formatted],
      done: defaultDaysPay[formatted].done + 1,
    };
  }
  result.payments.days = Object.values(defaultDaysPay);
  result.payments.totalData.done = newPayments.length;
  return result;
}

export async function getProfitsReport(date) {
  const startDate = setDateToInitial(dateFromString(date));
  const endDate = setDateToEnd(startDate);
  const _1stDayWeek = getFirstWeekDay(startDate);
  const _lastDayWeek = getLastWeekDay(startDate);
  const _1stDayMonth = dayjs(startDate).startOf("month").toDate();
  const _lastDayMonth = dayjs(startDate).endOf("month").toDate();
  const _1stDayYear = dayjs(startDate).startOf("year").toDate();
  const _lastDayYear = dayjs(startDate).endOf("year").toDate();

  let currentDate = setDateToEnd(new Date());
  if (currentDate.getTime() >= endDate.getTime()) {
    currentDate = endDate;
  }

  const byDay = await Payment.aggregate(getAggregateProfit(startDate, endDate));
  const byWeek = await Payment.aggregate(getAggregateProfit(_1stDayWeek, _lastDayWeek));
  const byMonth = await Payment.aggregate(getAggregateProfit(_1stDayMonth, _lastDayMonth));
  const byYear = await Payment.aggregate(getAggregateProfit(_1stDayYear, _lastDayYear));

  let result = {
    day: {
      ...byDay[0]
    },
    week: {
      ...byWeek[0],
      start: capitalizeFirstLetter(format(_1stDayWeek, "eee dd", {
        locale: es,
      })),
      end: capitalizeFirstLetter(format(_lastDayWeek, "eee dd", {
        locale: es,
      }))
    },
    month: {
      ...byMonth[0],
      name: format(_1stDayMonth, "MMMM", {
        locale: es,
      }).toLocaleUpperCase()
    },
    year: {
      ...byYear[0],
      number: format(_1stDayYear, "yyyy", {
        locale: es,
      })
    },
  };
  return result;
}
