import { RentDelivery } from "../models/RentDelivery";
import { RentPickup } from "../models/RentPickup";
import { RentChange } from "../models/RentChange";
import { CurrentRentsLog } from "../models/CurrentRentsLog";
import { User } from "../models/User";
import { Machine } from "../models/Machine";
import { Mantainance } from "../models/Mantainance";
import { Role } from "../models/Role";
import { MachineMovement } from "../models/MachineMovement";
import { ExtraTrip } from "../models/ExtraTrip";
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
  getLastDayMonth,
} from "../client/utils";
import dayjs from "dayjs";

import { Customer } from "../models/Customer";
import { Payment } from "../models/Payment";
import { SalePayment } from "../models/SalePayment";
import { HOW_FOUND_LIST, PAYMENT_REASONS } from "../consts/OBJ_CONTS";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { CustomerMovement } from "../models/CustomerMovement";
import { TechnicianWeeklyBonus } from "../models/TechnicianWeeklyBonus";
import { SaleDelivery } from "../models/SaleDelivery";
import { Sale } from "../models/Sale";
import { SalePickup } from "../models/SalePickup";
import { WarehouseMachine } from "../models/WarehouseMachine";
import { ConditioningRecord } from '../models/ConditioningRecord';

const PUNCTUALITY_BONUS = 125;
const REPAIR_BONUS = 250;
const NO_FAILURES_BONUS = 250;

function getAggregateProfit(startDate, endDate) {
  return [
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
  ];
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
    bonuses: {
      dayTotal: 0,
      monthTotal: 0,
    },
    externalPayments: {
      dayTotal: 0,
      monthTotal: 0,
    },
    salesPayments: {
      dayTotal: 0,
      monthTotal: 0,
    },
    sales: {
      dayTotal: 0,
      monthTotal: 0,
    },
    collectionVisits: {
      dayTotal: 0,
      monthTotal: 0,
    },
    warehouse: {
      newMachines: { dayTotal: 0, monthTotal: 0 },
      conditioned: { dayTotal: 0, monthTotal: 0 },
      streetMachines: { dayTotal: 0, monthTotal: 0 },
      replacements: { dayTotal: 0, monthTotal: 0 },
      dismantled: { dayTotal: 0, monthTotal: 0 }
    }
  };

  // Deliveries
  const monthDeliveries = await RentDelivery.find({
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  }).lean();
  const dayDeliveries = monthDeliveries.filter((delivery) =>
    isDateInRange(delivery.finishedAt, startDate, endDate)
  );
  result.deliveries.monthTotal = monthDeliveries.length;
  result.deliveries.dayTotal = dayDeliveries.length;

  // Pickups
  const monthPickups = await RentPickup.find({
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  }).lean();
  const dayPickups = monthPickups.filter((pickup) =>
    isDateInRange(pickup.finishedAt, startDate, endDate)
  );

  // Sale Pickups (warranty + cancellation)
  const monthSalePickups = await SalePickup.find({
    status: "COMPLETADA",
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  }).lean();
  const daySalePickups = monthSalePickups.filter((pickup) =>
    isDateInRange(pickup.finishedAt, startDate, endDate)
  );

  result.pickups.monthTotal = monthPickups.length + monthSalePickups.length;
  result.pickups.dayTotal = dayPickups.length + daySalePickups.length;

  // Changes
  const monthChanges = await RentChange.find({
    finishedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
  }).lean();
  const dayChanges = monthChanges.filter((change) =>
    isDateInRange(change.finishedAt, startDate, endDate)
  );
  result.changes.monthTotal = monthChanges.length;
  result.changes.dayTotal = dayChanges.length;

  // Customers
  const monthCustomers = await Customer.find({
    firstRentAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    howFound: { $ne: "old" },
  }).lean();
  const dayCustomers = monthCustomers.filter((customer) =>
    isDateInRange(customer.firstRentAt, startDate, endDate)
  );
  result.customers.monthTotal = monthCustomers.length;
  result.customers.dayTotal = dayCustomers.length;

  // Payments
  const monthPayments = await Payment.find({
    date: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    method: { $in: ["DEP", "TRANSFER", "CASH_OFFICE"] },
    reason: { $ne: "EXTERNAL_REPAIR" },
  }).lean();
  const dayPayments = monthPayments.filter((payment) =>
    isDateInRange(payment.date, startDate, endDate)
  );
  result.payments.monthTotal = monthPayments.length;
  result.payments.dayTotal = dayPayments.length;

    // Bonuses
    const monthBonuses = await CustomerMovement.find({
      date: { $gte: _1stDayMonth, $lte: _lastDayMonth },
      type: "BONUS",
    }).lean();
    const dayBonuses = monthBonuses.filter((mov) =>
      isDateInRange(mov.date, startDate, endDate)
    );
    result.bonuses.monthTotal = monthBonuses.length;
    result.bonuses.dayTotal = dayBonuses.length;

    // External Repair Payments
    const monthExternalPayments = await Payment.find({
      date: { $gte: _1stDayMonth, $lte: _lastDayMonth },
      reason: "EXTERNAL_REPAIR",
    }).lean();
    const dayExternalPayments = monthExternalPayments.filter((payment) =>
      isDateInRange(payment.date, startDate, endDate)
    );
    result.externalPayments.monthTotal = monthExternalPayments.length;
    result.externalPayments.dayTotal = dayExternalPayments.length;

    // Sales Payments
    const monthSalesPayments = await SalePayment.find({
      paymentDate: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    }).lean();
    const daySalesPayments = monthSalesPayments.filter((payment) =>
      isDateInRange(payment.paymentDate, startDate, endDate)
    );
    result.salesPayments.monthTotal = monthSalesPayments.length;
    result.salesPayments.dayTotal = daySalesPayments.length;

    // Sales 
    const monthSales = await SaleDelivery.find({
      type: "ENTREGA",
      status: "COMPLETADA",
      completedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    }).lean();

    const daySales = monthSales.filter((sale) =>
      isDateInRange(sale.completedAt, startDate, endDate)
    );

    result.sales.monthTotal = monthSales.length;
    result.sales.dayTotal = daySales.length;

    // Collection visits
    const monthCollections = await SaleDelivery.find({
      type: "COBRANZA",
      status: "COMPLETADA",
      completedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth },
    }).lean();

    const dayCollections = monthCollections.filter((col) =>
      isDateInRange(col.completedAt, startDate, endDate)
    );

    result.collectionVisits.monthTotal = monthCollections.length;
    result.collectionVisits.dayTotal = dayCollections.length;

    // NEW MACHINES
    const monthNewMachines = await WarehouseMachine.find({
      origin: 'NUEVA',
      createdAt: { $gte: _1stDayMonth, $lte: _lastDayMonth }
    }).lean();

    const dayNewMachines = monthNewMachines.filter(m =>
      isDateInRange(m.createdAt, startDate, endDate)
    );

    result.warehouse.newMachines.monthTotal = monthNewMachines.length;
    result.warehouse.newMachines.dayTotal = dayNewMachines.length;


    // CONDITIONING
    const monthConditioned = await ConditioningRecord.find({
      status: 'COMPLETADO',
      completedAt: { $gte: _1stDayMonth, $lte: _lastDayMonth }
    }).lean();

    const dayConditioned = monthConditioned.filter(c =>
      isDateInRange(c.completedAt, startDate, endDate)
    );

    result.warehouse.conditioned.monthTotal = monthConditioned.length;
    result.warehouse.conditioned.dayTotal = dayConditioned.length;


    // STREET MACHINES
    const monthStreet = await WarehouseMachine.find({
      origin: 'COMPRA_CALLE',
      createdAt: { $gte: _1stDayMonth, $lte: _lastDayMonth }
    }).lean();

    const dayStreet = monthStreet.filter(m =>
      isDateInRange(m.createdAt, startDate, endDate)
    );

    result.warehouse.streetMachines.monthTotal = monthStreet.length;
    result.warehouse.streetMachines.dayTotal = dayStreet.length;


    // REPLACEMENTS
    const monthReplacements = await WarehouseMachine.find({
      origin: 'REPUESTA',
      createdAt: { $gte: _1stDayMonth, $lte: _lastDayMonth }
    }).lean();

    const dayReplacements = monthReplacements.filter(m =>
      isDateInRange(m.createdAt, startDate, endDate)
    );

    result.warehouse.replacements.monthTotal = monthReplacements.length;
    result.warehouse.replacements.dayTotal = dayReplacements.length;


    // DISMANTLED
    const monthDismantled = await WarehouseMachine.find({
      status: 'DESMANTELADA',
      createdAt: { $gte: _1stDayMonth, $lte: _lastDayMonth }
    }).lean();

    const dayDismantled = monthDismantled.filter(m =>
      isDateInRange(m.createdAt, startDate, endDate)
    );

    result.warehouse.dismantled.monthTotal = monthDismantled.length;
    result.warehouse.dismantled.dayTotal = dayDismantled.length;

  return result;
}

export async function getSummaryByRange(start, period) {
  const startDate = setDateToInitial(dateFromString(start));
  const endDate = setDateToEnd(period === "week" ? addDaysToDate(startDate, 6) : getLastDayMonth(startDate));

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
    bonuses: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    externalPayments: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    salesPayments: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    extraTrips: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    currentRents: {
      average: 0,
      days: [],
    },
    sales: {
      totalData: { 
        done: 0 
      },
      days: [],
    },
    collectionVisits: {
      totalData: { 
        sent: 0,
        done: 0 
      },
      days: [],
    },
    warehouseNew: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    warehouseStreet: {
      totalData: { 
        done: 0 
      },
      days: [],
    },
    warehouseReplaced: {
      totalData: { 
        done: 0 
      },
      days: [],
    },
    warehouseDismantled: {
      totalData: { 
        done: 0 
      },
      days: [],
    },
    conditioning: {
      totalData: { 
        done: 0 
      },
      days: [],
    },
  };
  let nDays = 0;
  let totalCurrent = 0;
  let defaultDays = {};
  let defaultDaysRent = {};
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
    const currentRentsDate = await CurrentRentsLog.findOne({
      dateText: formatted.replaceAll("/", "-"),
    }).lean();
    if (currentRentsDate) {
      totalCurrent = totalCurrent + currentRentsDate.amount;
      nDays++;
    }
    defaultDaysRent[formatted] = {
      date: countDate,
      weekDay: format(countDate, "eeee", {
        locale: es,
      }),
      current: currentRentsDate?.amount || null,
    };

    countDate = addDaysToDate(countDate, 1);
  }
  result.currentRents.days = Object.values(defaultDaysRent);
  result.currentRents.average = totalCurrent / nDays;
  // Deliveries
  // Sent but not delivered updatedAt and status not "ENTREGADA"
  // done = finishedAt and status == "ENTREGADA"
  let defaultDaysDlv = structuredClone(defaultDays);

  const notDeliveried = await RentDelivery.find({
    status: "CANCELADA",
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  const doneDeliveries = await RentDelivery.find({
    status: "ENTREGADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).lean();

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
    status: "CANCELADO",
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  const doneChanges = await RentChange.find({
    status: "FINALIZADO",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).lean();

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
    status: "CANCELADA",
    date: { $gte: startDate, $lte: endDate },
  }).lean();
  const donePickups = await RentPickup.find({
    status: "RECOLECTADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).lean();
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

  // Sale Pickups (warranty + cancellation)
  const notPickedSale = await SalePickup.find({
    status: "CANCELADA",
    date: { $gte: startDate, $lte: endDate },
  }).lean();
  const donePickupsSale = await SalePickup.find({
    status: "COMPLETADA",
    finishedAt: { $gte: startDate, $lte: endDate },
  }).lean();
  for (const i in notPickedSale) {
    const pickup = notPickedSale[i];
    const formatted = format(pickup?.date, "dd/MM/yyyy");
    defaultDaysPick[formatted] = {
      ...defaultDaysPick[formatted],
      sent: defaultDaysPick[formatted].sent + 1,
    };
  }
  for (const i in donePickupsSale) {
    const pickup = donePickupsSale[i];
    const formatted = format(pickup?.finishedAt, "dd/MM/yyyy");
    defaultDaysPick[formatted] = {
      ...defaultDaysPick[formatted],
      sent: defaultDaysPick[formatted].sent + 1,
      done: defaultDaysPick[formatted].done + 1,
    };
  }

  result.pickups.days = Object.values(defaultDaysPick);
  result.pickups.totalData.sent = notPicked.length + donePickups.length + notPickedSale.length + donePickupsSale.length;
  result.pickups.totalData.done = donePickups.length + donePickupsSale.length;

  // Customers
  // New customers using first rent and howFound not "old"
  let defaultDaysCust = structuredClone(defaultDays);
  Object.keys(defaultDaysCust).forEach((keyDay) => {
    defaultDaysCust[keyDay].howFound = structuredClone(howFound);
  });
  const newCustomers = await Customer.find({
    howFound: { $ne: "old" },
    firstRentAt: { $gte: startDate, $lte: endDate },
  }).lean();
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
    reason: { $ne: "EXTERNAL_REPAIR" },
    date: { $gte: startDate, $lte: endDate },
  }).lean();

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

    // Bonuses
  // Customer movements where type is "BONUS"
  let defaultDaysBonus = structuredClone(defaultDays);
  const bonuses = await CustomerMovement.find({
    type: "BONUS",
    date: { $gte: startDate, $lte: endDate },
  }).select('date customer description createdBy')
  .populate([
    {
      path: 'customer',
      select: 'name',
      model: 'customers'
    },
    {
      path: 'createdBy',
      select: 'name',
      model: 'users'
    }
  ])
  .lean();

  for (const i in bonuses) {
    const mov = bonuses[i];
    const formatted = format(mov?.date, "dd/MM/yyyy");
    defaultDaysBonus[formatted] = {
      ...defaultDaysBonus[formatted],
      done: defaultDaysBonus[formatted].done + 1,
    };
    defaultDaysBonus[formatted].list ? defaultDaysBonus[formatted].list.push(mov) : defaultDaysBonus[formatted].list = [mov];
  }
  result.bonuses.days = Object.values(defaultDaysBonus);
  result.bonuses.totalData.done = bonuses.length;

  // External Repair Payments
  let defaultDaysExternal = structuredClone(defaultDays);
  const externalPayments = await Payment.find({
    reason: "EXTERNAL_REPAIR",
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const i in externalPayments) {
    const payment = externalPayments[i];
    const formatted = format(payment?.date, "dd/MM/yyyy");
    defaultDaysExternal[formatted] = {
      ...defaultDaysExternal[formatted],
      done: defaultDaysExternal[formatted].done + 1,
    };
  }
  result.externalPayments.days = Object.values(defaultDaysExternal);
  result.externalPayments.totalData.done = externalPayments.length;

  // Sales Payments
  let defaultDaysSales = structuredClone(defaultDays);
  const salesPayments = await SalePayment.find({
    paymentDate: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const i in salesPayments) {
    const payment = salesPayments[i];
    const formatted = format(payment?.paymentDate, "dd/MM/yyyy");
    defaultDaysSales[formatted] = {
      ...defaultDaysSales[formatted],
      done: defaultDaysSales[formatted].done + 1,
    };
  }
  result.salesPayments.days = Object.values(defaultDaysSales);
  result.salesPayments.totalData.done = salesPayments.length;

  // Extra Trips
  let defaultDaysExtraTrips = structuredClone(defaultDays);
  const extraTrips = await ExtraTrip.find({
    status: "COMPLETADA",
    completedAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const i in extraTrips) {
    const trip = extraTrips[i];
    const formatted = format(trip?.completedAt, "dd/MM/yyyy");
    defaultDaysExtraTrips[formatted] = {
      ...defaultDaysExtraTrips[formatted],
      done: defaultDaysExtraTrips[formatted].done + 1,
    };
  }
  result.extraTrips.days = Object.values(defaultDaysExtraTrips);
  result.extraTrips.totalData.done = extraTrips.length;

  // Sales 
  let defaultDaysSalesDeliveries = structuredClone(defaultDays);

  const salesDeliveries = await SaleDelivery.find({
    type: "ENTREGA",
    status: "COMPLETADA",
    completedAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const i in salesDeliveries) {
    const sale = salesDeliveries[i];
    const formatted = format(sale.completedAt, "dd/MM/yyyy");
    defaultDaysSalesDeliveries[formatted] = {
      ...defaultDaysSalesDeliveries[formatted],
      done: defaultDaysSalesDeliveries[formatted].done + 1,
    };
  }

  result.sales.days = Object.values(defaultDaysSalesDeliveries);
  result.sales.totalData.done = salesDeliveries.length;

  // Collection Visits
  let defaultDaysCollections = structuredClone(defaultDays);

  let totalCollectionsSent = 0;
  let totalCollectionsDone = 0;

  const salesWithCollections = await Sale.find({
    "collectionVisits.createdAt": {
      $lte: endDate
    }
  }).lean();

  for (const sale of salesWithCollections) {
    for (const visit of sale.collectionVisits) {
      if (
        visit.createdAt &&
        visit.createdAt >= startDate &&
        visit.createdAt <= endDate
      ) {
        const formatted = format(visit.createdAt, "dd/MM/yyyy");
        defaultDaysCollections[formatted].sent += 1;
        totalCollectionsSent++;
      }

      if (
        visit.completed &&
        visit.completedAt &&
        visit.completedAt >= startDate &&
        visit.completedAt <= endDate
      ) {
        const formatted = format(visit.completedAt, "dd/MM/yyyy");
        defaultDaysCollections[formatted].done += 1;
        totalCollectionsDone++;
      }
    }
  }

  result.collectionVisits.days = Object.values(defaultDaysCollections);
  result.collectionVisits.totalData.sent = totalCollectionsSent;
  result.collectionVisits.totalData.done = totalCollectionsDone;

  // Warehouse - New Machines
  let defaultDaysWarehouseNew = structuredClone(defaultDays);

  const newMachines = await WarehouseMachine.find({
    origin: "NUEVA",
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const machine of newMachines) {
    const formatted = format(machine.createdAt, "dd/MM/yyyy");

    if (defaultDaysWarehouseNew[formatted]) {
      defaultDaysWarehouseNew[formatted] = {
        ...defaultDaysWarehouseNew[formatted],
        done: defaultDaysWarehouseNew[formatted].done + 1,
      };
    }
  }

  result.warehouseNew.days = Object.values(defaultDaysWarehouseNew);
  result.warehouseNew.totalData.done = newMachines.length;

  // Warehouse -  Street Machines
  let defaultDaysWarehouseStreet = structuredClone(defaultDays);

  const streetMachines = await WarehouseMachine.find({
    origin: "COMPRA_CALLE",
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const machine of streetMachines) {
    const formatted = format(machine.createdAt, "dd/MM/yyyy");

    if (defaultDaysWarehouseStreet[formatted]) {
      defaultDaysWarehouseStreet[formatted] = {
        ...defaultDaysWarehouseStreet[formatted],
        done: defaultDaysWarehouseStreet[formatted].done + 1,
      };
    }
  }

  result.warehouseStreet.days = Object.values(defaultDaysWarehouseStreet);
  result.warehouseStreet.totalData.done = streetMachines.length;

  // Warehouse - Replaced Machines
  let defaultDaysWarehouseReplaced = structuredClone(defaultDays);

  const replacedMachines = await WarehouseMachine.find({
    origin: "REPUESTA",
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const machine of replacedMachines) {
    const formatted = format(machine.createdAt, "dd/MM/yyyy");

    if (defaultDaysWarehouseReplaced[formatted]) {
      defaultDaysWarehouseReplaced[formatted] = {
        ...defaultDaysWarehouseReplaced[formatted],
        done: defaultDaysWarehouseReplaced[formatted].done + 1,
      };
    }
  }

  result.warehouseReplaced.days = Object.values(defaultDaysWarehouseReplaced);
  result.warehouseReplaced.totalData.done = replacedMachines.length;

  // Warehouse - Dismantled Machines
  let defaultDaysWarehouseDismantled = structuredClone(defaultDays);

  const dismantledMachines = await WarehouseMachine.find({
    origin: "DESMANTELADA",
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const machine of dismantledMachines) {
    const formatted = format(machine.createdAt, "dd/MM/yyyy");

    if (defaultDaysWarehouseDismantled[formatted]) {
      defaultDaysWarehouseDismantled[formatted] = {
        ...defaultDaysWarehouseDismantled[formatted],
        done: defaultDaysWarehouseDismantled[formatted].done + 1,
      };
    }
  }

  result.warehouseDismantled.days = Object.values(defaultDaysWarehouseDismantled);
  result.warehouseDismantled.totalData.done = dismantledMachines.length;

  // Conditioning
  let defaultDaysConditioning = structuredClone(defaultDays);

  const conditioningMachines = await ConditioningRecord.find({
    origin: "COMPLETADO",
    completedAt: { $gte: startDate, $lte: endDate },
  }).lean();

  for (const machine of conditioningMachines) {
    const formatted = format(machine.completedAt, "dd/MM/yyyy");

    if (defaultDaysConditioning[formatted]) {
      defaultDaysConditioning[formatted] = {
        ...defaultDaysConditioning[formatted],
        done: defaultDaysConditioning[formatted].done + 1,
      };
    }
  }

  result.conditioning.days = Object.values(defaultDaysConditioning);
  result.conditioning.totalData.done = conditioningMachines.length;

  return result;
}

export async function getProfitsByRange(start, end) {
  let TOTAL = 0;
  const startDate = setDateToInitial(dateFromString(start));
  const endDate = setDateToEnd(dateFromString(end));
  let countDate = startDate;
  const days = {};
  let groupedMap = {};
  let currentDate = setDateToEnd(new Date());
  if (currentDate.getTime() >= endDate.getTime()) {
    currentDate = endDate;
  }

  // Get unique paymentAccounts used in payments within the date range (new format)
  let groupedPaymentAccounts = await Payment.aggregate([
    {
      $match: {
        paymentAccount: {
          $ne: null,
        },
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$paymentAccount",
      },
    },
    {
      $lookup: {
        from: "payment_accounts",
        localField: "_id",
        foreignField: "_id",
        as: "accountInfo"
      }
    },
    {
      $unwind: "$accountInfo"
    },
    {
      $project: {
        _id: 1,
        bank: "$accountInfo.bank",
        number: "$accountInfo.number",
        count: "$accountInfo.count",
        type: "$accountInfo.type"
      }
    }
  ]);

  // Get unique legacy accounts (old format - string accounts)
  let groupedLegacyAccounts = await Payment.aggregate([
    {
      $match: {
        account: { $ne: null },
        paymentAccount: null,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$account",
      },
    },
  ]);

  while (isDateInRange(countDate, startDate, endDate)) {
    const formatted = format(countDate, "dd/MM/yyyy");
    days[formatted] = {
      date: formatted,
      count: 0,
      done: 0,
    };
    countDate = addDaysToDate(countDate, 1);
  }

  let grouped = [];
  let currentIndex = 0;

  // Add new paymentAccount groups
  groupedPaymentAccounts.forEach((result) => {
    groupedMap[`new_${result._id.toString()}`] = currentIndex;
    grouped.push({ 
      paymentAccountId: result._id.toString(),
      paymentAccount: `${result.bank} ${result.count}`,
      bank: result.bank,
      accountNumber: result.number,
      type: result.type,
      days: structuredClone(days), 
      total: 0, 
      count: 0 
    });
    currentIndex++;
  });

  // Add legacy account groups
  groupedLegacyAccounts.forEach((result) => {
    groupedMap[`legacy_${result._id}`] = currentIndex;
    grouped.push({ 
      account: result._id,
      paymentAccount: result._id, // Use legacy account string as display
      isLegacy: true,
      days: structuredClone(days), 
      total: 0, 
      count: 0 
    });
    currentIndex++;
  });

  // Add CASH methods
  groupedMap["CASH"] = currentIndex;
  grouped.push({ method: "CASH", paymentAccount: "Efectivo", days: structuredClone(days), total: 0, count: 0 });
  currentIndex++;
  
  groupedMap["CASH_OFFICE"] = currentIndex;
  grouped.push({ method: "CASH_OFFICE", paymentAccount: "Efectivo (Oficina)", days: structuredClone(days), total: 0, count: 0 });
  
  const payments = await Payment.find({
    method: { $in: ["DEP", "TRANSFER", "CASH", "CASH_OFFICE"] },
    date: { $gte: startDate, $lte: endDate },
  });
  
  payments.forEach((payment) => {
    const formatted = format(payment.date, "dd/MM/yyyy");
    let index;
    
    if (["CASH", "CASH_OFFICE"].includes(payment.method)) {
      index = groupedMap[payment.method];
    } else if (payment.paymentAccount) {
      // New payments with paymentAccount reference
      index = groupedMap[`new_${payment.paymentAccount.toString()}`];
    } else if (payment.account) {
      // Legacy payments with string account
      index = groupedMap[`legacy_${payment.account}`];
    }
    
    if (index !== undefined && grouped[index]) {
      grouped[index].days[formatted].done += payment.amount;
      grouped[index].days[formatted].count += 1;
      grouped[index].count += 1;
      grouped[index].total += payment.amount;
      TOTAL += payment.amount;
    }
  });
  
  grouped = grouped.map((result) => {
    return { ...result, days: Object.values(result.days) };
  });
  
  return {
    groups: grouped.sort((a, b) => {
      // Sort order: 1. CASH, 2. CASH_OFFICE, 3. Legacy accounts, 4. New accounts
      const getOrder = (item) => {
        if (item.method === 'CASH') return 0;
        if (item.method === 'CASH_OFFICE') return 1;
        if (item.isLegacy) return 2;
        return 3; // New accounts with paymentAccountId
      };
      
      const orderA = getOrder(a);
      const orderB = getOrder(b);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Within same category, sort alphabetically by paymentAccount name
      const aName = a.paymentAccount || '';
      const bName = b.paymentAccount || '';
      return aName.localeCompare(bName);
    }),
    TOTAL,
  };
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
  const byWeek = await Payment.aggregate(
    getAggregateProfit(_1stDayWeek, _lastDayWeek)
  );
  const byMonth = await Payment.aggregate(
    getAggregateProfit(_1stDayMonth, _lastDayMonth)
  );
  const byYear = await Payment.aggregate(
    getAggregateProfit(_1stDayYear, _lastDayYear)
  );

  let result = {
    day: {
      ...byDay[0],
    },
    week: {
      ...byWeek[0],
      start: capitalizeFirstLetter(
        format(_1stDayWeek, "eee dd", {
          locale: es,
        })
      ),
      end: capitalizeFirstLetter(
        format(_lastDayWeek, "eee dd", {
          locale: es,
        })
      ),
    },
    month: {
      ...byMonth[0],
      name: format(_1stDayMonth, "MMMM", {
        locale: es,
      }).toLocaleUpperCase(),
    },
    year: {
      ...byYear[0],
      number: format(_1stDayYear, "yyyy", {
        locale: es,
      }),
    },
  };
  return result;
}

export async function getTechniciansReport(start, end, userRole, userId) {
  const mongoose = require('mongoose');
  const weekStart = setDateToInitial(dateFromString(start));
  const weekEnd = setDateToEnd(getLastWeekDay(dateFromString(end)));
  
  // Find TEC role
  const tecRole = await Role.findOne({ id: 'TEC' }).lean();
  if (!tecRole) {
    throw new Error('TEC role not found');
  }
  
  // Get all active technician users with their machine ranges
  const technicians = userRole === 'TEC' ? [await User.findById(userId).lean()] : await User.find({
    isActive: true,
    role: tecRole._id
  })
  .select('_id name startM endM tecPay')
  .lean();

  if (technicians.length === 0) {
    return { weekStart, weekEnd, technicians: [], totalTechnicians: 0, totalMachines: 0, totalMaintenances: 0, totalPayment: 0 };
  }

  const techIds = technicians.map(t => t._id);
  const minM = Math.min(...technicians.map(t => t.startM));
  const maxM = Math.max(...technicians.map(t => t.endM));

  // Repair bonus date boundaries
  const previousThursday = setDateToInitial(addDaysToDate(weekStart, -1));
  const wednesdayEnd = setDateToEnd(addDaysToDate(weekStart, 5));
  const thursdayEnd = setDateToEnd(addDaysToDate(weekStart, 6));

  // ═══ PHASE 1: Batch fetch all independent data in parallel ═══
  const [
    allMachines,
    allConditionings,
    allTechMaintenances,
    allRepairBonusMaintenances,
    allBonusRecords
  ] = await Promise.all([
    Machine.find({ machineNum: { $gte: minM, $lte: maxM }, active: true })
      .select('_id machineNum').lean(),
    ConditioningRecord.find({
      technician: { $in: techIds },
      status: 'COMPLETADO',
      completedAt: { $gte: weekStart, $lte: weekEnd }
    }).lean(),
    Mantainance.find({
      takenBy: { $in: techIds },
      status: 'FINALIZADO',
      finishedAt: { $gte: weekStart, $lte: weekEnd }
    }).populate('machine', 'machineNum').select('machine finishedAt takenBy').sort({ finishedAt: -1 }).lean(),
    Mantainance.find({
      takenBy: { $in: techIds },
      createdAt: { $gte: previousThursday, $lte: wednesdayEnd }
    }).lean(),
    TechnicianWeeklyBonus.find({
      technician: { $in: techIds },
      weekStart: weekStart
    }).lean()
  ]);

  const allMachineIds = allMachines.map(m => m._id);

  // ═══ PHASE 2: Batch aggregations for all machines ═══
  const [allLatestMaintenances, allChangesInWeek] = await Promise.all([
    Mantainance.aggregate([
      { $match: { machine: { $in: allMachineIds }, status: 'FINALIZADO' } },
      { $sort: { finishedAt: -1 } },
      { $group: { _id: '$machine', latestMaintenance: { $first: '$$ROOT' } } }
    ]),
    // Single aggregation replaces per-technician changesInWeek AND failuresInWeek
    RentChange.aggregate([
      { $match: { createdAt: { $gte: weekStart, $lte: weekEnd } } },
      { $lookup: { from: 'rents', localField: 'rent', foreignField: '_id', as: 'rentData' } },
      { $unwind: '$rentData' },
      { $addFields: { effectiveMachine: { $ifNull: ['$pickedMachine', '$rentData.machine'] } } },
      { $match: { effectiveMachine: { $in: allMachineIds } } },
      { $lookup: { from: 'machines', localField: 'effectiveMachine', foreignField: '_id', as: 'machineData' } },
      { $unwind: '$machineData' },
      { $project: {
          pickedMachine: { _id: '$effectiveMachine', machineNum: '$machineData.machineNum' },
          createdAt: 1, problemDesc: 1, solutionDesc: 1, status: 1, wasFixed: 1, reason: 1
      }},
      { $sort: { createdAt: -1 } }
    ])
  ]);

  // Build lookup maps for latest maintenances
  const latestMaintenanceMap = new Map();
  for (const m of allLatestMaintenances) {
    latestMaintenanceMap.set(m._id.toString(), m);
  }

  // Index changes by machine ID (latest first per machine, plus full array for failures)
  const latestChangeByMachine = new Map();
  const allChangesByMachineArr = new Map();
  for (const change of allChangesInWeek) {
    const mid = change.pickedMachine._id.toString();
    if (!latestChangeByMachine.has(mid)) {
      latestChangeByMachine.set(mid, change);
    }
    if (!allChangesByMachineArr.has(mid)) {
      allChangesByMachineArr.set(mid, []);
    }
    allChangesByMachineArr.get(mid).push(change);
  }

  // ═══ PHASE 3: Batch movements for machines with changes ═══
  const allMachineIdsWithChanges = [...latestChangeByMachine.keys()];

  let movementMap = new Map();
  if (allMachineIdsWithChanges.length > 0) {
    const allLatestMovements = await MachineMovement.aggregate([
      { $match: {
          machine: { $in: allMachineIdsWithChanges.map(id => mongoose.Types.ObjectId(id)) },
          type: { $in: ['RENT', 'CHANGE'] }
      }},
      { $sort: { date: -1 } },
      { $group: { _id: '$machine', latestMovement: { $first: '$$ROOT' } } }
    ]);
    for (const m of allLatestMovements) {
      movementMap.set(m._id.toString(), m);
    }
  }

  // ═══ PHASE 4: Batch previous changes for maintenance machines ═══
  // Gets latest changes per machine (sorted desc, top 10) to match against each maintenance's finishedAt
  const uniqueMaintenanceMachineIds = [...new Set(
    allTechMaintenances
      .filter(m => m.machine && m.machine._id)
      .map(m => m.machine._id)
  )];

  const previousChangesMap = new Map();
  if (uniqueMaintenanceMachineIds.length > 0) {
    const previousChangesResult = await RentChange.aggregate([
      { $lookup: { from: 'rents', localField: 'rent', foreignField: '_id', as: 'rentData' } },
      { $unwind: '$rentData' },
      { $addFields: { effectiveMachine: { $ifNull: ['$pickedMachine', '$rentData.machine'] } } },
      { $match: { effectiveMachine: { $in: uniqueMaintenanceMachineIds } } },
      { $project: { effectiveMachine: 1, problemDesc: 1, createdAt: 1 } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$effectiveMachine',
          changes: { $push: { problemDesc: '$problemDesc', createdAt: '$createdAt' } }
      }},
      { $project: { changes: { $slice: ['$changes', 10] } } }
    ]);
    for (const r of previousChangesResult) {
      previousChangesMap.set(r._id.toString(), r.changes);
    }
  }

  // ═══ Index batch results by technician ═══
  const conditioningsByTech = new Map();
  for (const c of allConditionings) {
    const tid = c.technician.toString();
    if (!conditioningsByTech.has(tid)) conditioningsByTech.set(tid, []);
    conditioningsByTech.get(tid).push(c);
  }

  const techMaintenancesByTech = new Map();
  for (const m of allTechMaintenances) {
    const tid = m.takenBy.toString();
    if (!techMaintenancesByTech.has(tid)) techMaintenancesByTech.set(tid, []);
    techMaintenancesByTech.get(tid).push(m);
  }

  const repairBonusByTech = new Map();
  for (const m of allRepairBonusMaintenances) {
    const tid = m.takenBy.toString();
    if (!repairBonusByTech.has(tid)) repairBonusByTech.set(tid, []);
    repairBonusByTech.get(tid).push(m);
  }

  const bonusRecordByTech = new Map();
  for (const b of allBonusRecords) {
    bonusRecordByTech.set(b.technician.toString(), b);
  }

  // Batch-create missing bonus records
  const techsWithoutBonus = technicians.filter(t => !bonusRecordByTech.has(t._id.toString()));
  if (techsWithoutBonus.length > 0) {
    const newBonusRecords = await TechnicianWeeklyBonus.insertMany(
      techsWithoutBonus.map(t => ({
        technician: t._id,
        weekStart,
        weekEnd,
        punctualityBonus: { amount: PUNCTUALITY_BONUS, active: true }
      }))
    );
    for (const b of newBonusRecords) {
      bonusRecordByTech.set(b.technician.toString(), b.toObject());
    }
  }

  // ═══ PHASE 5: Process each technician using in-memory data (no per-tech DB queries) ═══
  const technicianReports = technicians.map((tech) => {
    const techId = tech._id.toString();

    // Filter machines for this technician's range from pre-fetched data
    const machinesInRange = allMachines.filter(
      m => m.machineNum >= tech.startM && m.machineNum <= tech.endM
    );
    const machineIds = machinesInRange.map(m => m._id);
    const machineIdSet = new Set(machineIds.map(id => id.toString()));

    const techConditionings = conditioningsByTech.get(techId) || [];

    if (machineIds.length === 0) {
      const conditioningCount = techConditionings.length;
      const conditioningPayment = conditioningCount * 200;

      return {
        technician: {
          _id: tech._id,
          name: tech.name,
          range: `${tech.startM} - ${tech.endM}`
        },
        machines: [],
        totalMachines: 0,
        completedMaintenances: [],
        totalMaintenances: 0,
        payableMaintenances: 0,
        maintenancesPayment: 0,
        conditioningCount,
        conditioningPayment,
        bonuses: {
          punctuality: { amount: PUNCTUALITY_BONUS, active: true },
          repair: { amount: REPAIR_BONUS, active: true, totalMaintenances: 0, completedMaintenances: 0, eligible: true },
          noFailures: { amount: NO_FAILURES_BONUS, active: true, failuresCount: 0, failures: [] }
        },
        totalPayment: conditioningPayment
      };
    }

    // Get latest change per machine for this tech's machines
    const latestChangesByMachineForTech = {};
    for (const mid of machineIdSet) {
      const change = latestChangeByMachine.get(mid);
      if (change) {
        latestChangesByMachineForTech[mid] = change;
      }
    }

    const machinesWithChanges = Object.keys(latestChangesByMachineForTech);

    // Build qualified machines (change date - movement date < 15 days)
    const qualifiedMachines = [];
    for (const machineId of machinesWithChanges) {
      const change = latestChangesByMachineForTech[machineId];
      const movementData = movementMap.get(machineId);
      const maintenanceData = latestMaintenanceMap.get(machineId);

      if (movementData && movementData.latestMovement) {
        const changeDate = new Date(change.createdAt);
        const movementDate = new Date(movementData.latestMovement.date);
        const daysDiff = Math.floor((changeDate - movementDate) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 0 && daysDiff < 15) {
          qualifiedMachines.push({
            _id: machineId,
            machineNum: change.pickedMachine.machineNum,
            latestChange: {
              date: change.createdAt,
              problemDesc: change.problemDesc || 'N/A',
              solutionDesc: change.solutionDesc || 'N/A',
              status: change.status || 'N/A',
              wasFixed: change.wasFixed || false,
              reason: change.reason || 'N/A'
            },
            latestMovementDate: movementData.latestMovement.date,
            latestMaintenanceDate: maintenanceData?.latestMaintenance?.finishedAt || null,
            daysSinceMovement: daysDiff
          });
        }
      }
    }

    qualifiedMachines.sort((a, b) => a.machineNum - b.machineNum);

    // Tech maintenances with previous change lookup (in-memory, no DB queries)
    const techMaintenances = techMaintenancesByTech.get(techId) || [];

    const maintenancesList = techMaintenances.map(m => {
      const machineChanges = previousChangesMap.get(m.machine._id.toString()) || [];
      const previousChange = machineChanges.find(c => new Date(c.createdAt) < new Date(m.finishedAt)) || null;

      return {
        machineId: m.machine._id.toString(),
        machineNum: m.machine.machineNum,
        finishedAt: m.finishedAt,
        previousChangeProblem: previousChange?.problemDesc || null,
        previousChangeDate: previousChange?.createdAt || null
      };
    });

    // Mark maintenances with exclusion flag and filter payable ones
    const machineIdsWithChanges = qualifiedMachines.map(m => m._id);
    const maintenancesWithExclusion = maintenancesList.map(m => ({
      ...m,
      excludedFromPayment: machineIdsWithChanges.includes(m.machineId)
    }));

    const payableMaintenances = maintenancesWithExclusion.filter(
      m => !m.excludedFromPayment
    );

    const maintenancesPayment = payableMaintenances.length * (tech.tecPay || 0);

    const conditioningCount = techConditionings.length;
    const conditioningPayment = conditioningCount * 200;

    // Repair bonus eligibility
    const techRepairMaintenances = repairBonusByTech.get(techId) || [];
    const totalMaintenancesForBonus = techRepairMaintenances.length;
    const completedByThursday = techRepairMaintenances.filter(m =>
      m.status === 'FINALIZADO' && m.finishedAt && new Date(m.finishedAt) <= thursdayEnd
    ).length;
    const repairBonusEligible = totalMaintenancesForBonus === 0 || completedByThursday === totalMaintenancesForBonus;

    // No Failures bonus - filter from pre-fetched changes (status != CANCELADO)
    const failuresInWeek = [];
    for (const mid of machineIdSet) {
      const changes = allChangesByMachineArr.get(mid);
      if (changes) {
        for (const change of changes) {
          if (change.status !== 'CANCELADO') {
            failuresInWeek.push(change);
          }
        }
      }
    }
    const noFailuresBonusActive = failuresInWeek.length < 6;

    // Bonus record (already pre-fetched or pre-created)
    const bonusRecord = bonusRecordByTech.get(techId);

    // Calculate total payment including bonuses
    const punctualityBonusAmount = bonusRecord.punctualityBonus.active ? PUNCTUALITY_BONUS : 0;
    const repairBonusAmount = repairBonusEligible ? REPAIR_BONUS : 0;
    const noFailuresBonusAmount = noFailuresBonusActive ? NO_FAILURES_BONUS : 0;
    const totalPayment = maintenancesPayment + conditioningPayment + punctualityBonusAmount + repairBonusAmount + noFailuresBonusAmount;

    return {
      technician: {
        _id: tech._id,
        name: tech.name,
        range: `${tech.startM} - ${tech.endM}`,
        tecPay: tech.tecPay || 0,
        startM: tech.startM
      },
      machines: qualifiedMachines,
      totalMachines: qualifiedMachines.length,
      completedMaintenances: maintenancesWithExclusion,
      totalMaintenances: maintenancesWithExclusion.length,
      payableMaintenances: payableMaintenances.length,
      maintenancesPayment: maintenancesPayment,
      conditioningCount,
      conditioningPayment,
      bonuses: {
        punctuality: {
          amount: PUNCTUALITY_BONUS,
          active: bonusRecord.punctualityBonus.active
        },
        repair: {
          amount: REPAIR_BONUS,
          active: repairBonusEligible,
          totalMaintenances: totalMaintenancesForBonus,
          completedMaintenances: completedByThursday,
          eligible: repairBonusEligible
        },
        noFailures: {
          amount: NO_FAILURES_BONUS,
          active: noFailuresBonusActive,
          failuresCount: failuresInWeek.length,
          failures: failuresInWeek.map(f => ({
            machineNum: f.pickedMachine.machineNum,
            date: f.createdAt,
            problem: f.problemDesc || f.reason || 'Sin descripción'
          }))
        }
      },
      totalPayment: totalPayment
    };
  });

  // Filter out technicians with no data and sort by RANGE
  const reportWithData = technicianReports
    .filter(report => 
      (report.machines && report.machines.length > 0) || 
      (report.completedMaintenances && report.completedMaintenances.length > 0) ||
      (report.conditioningCount && report.conditioningCount > 0)
    )
    .sort((a, b) => (a.technician.startM || 0) - (b.technician.startM || 0));
  
  // Calculate totals
  const totalMachinesWithChanges = reportWithData.reduce((sum, t) => sum + (t.totalMachines || 0), 0);
  const totalMaintenances = reportWithData.reduce((sum, t) => sum + (t.totalMaintenances || 0), 0);
  const totalPayment = reportWithData.reduce((sum, t) => sum + (t.totalPayment || 0), 0);
  
  return {
    weekStart,
    weekEnd,
    technicians: reportWithData,
    totalTechnicians: reportWithData.length,
    totalMachines: totalMachinesWithChanges,
    totalMaintenances: totalMaintenances,
    totalPayment: totalPayment
  };
}
