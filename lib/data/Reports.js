import { RentDelivery } from "../models/RentDelivery";
import { RentPickup } from "../models/RentPickup";
import { RentChange } from "../models/RentChange";
import { CurrentRentsLog } from "../models/CurrentRentsLog";
import { User } from "../models/User";
import { Machine } from "../models/Machine";
import { Mantainance } from "../models/Mantainance";
import { Rent } from "../models/Rent";
import { Role } from "../models/Role";
import { MachineMovement } from "../models/MachineMovement";
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
import { CustomerMovement } from "../models/CustomerMovement";
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
  result.pickups.monthTotal = monthPickups.length;
  result.pickups.dayTotal = dayPickups.length;

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
  }).lean();
  const dayPayments = monthPayments.filter((payment) =>
    isDateInRange(payment.date, startDate, endDate)
  );
  result.payments.monthTotal = monthPayments.length;
  result.payments.dayTotal = dayPayments.length;

    // Payments
    const monthBonuses = await CustomerMovement.find({
      date: { $gte: _1stDayMonth, $lte: _lastDayMonth },
      type: "BONUS",
    }).lean();
    const dayBonuses = monthBonuses.filter((mov) =>
      isDateInRange(mov.date, startDate, endDate)
    );
    result.bonuses.monthTotal = monthBonuses.length;
    result.bonuses.dayTotal = dayBonuses.length;
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
    bonuses: {
      totalData: {
        done: 0,
      },
      days: [],
    },
    currentRents: {
      average: 0,
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
  }).lean();

  for (const i in bonuses) {
    const mov = bonuses[i];
    const formatted = format(mov?.date, "dd/MM/yyyy");
    defaultDaysBonus[formatted] = {
      ...defaultDaysBonus[formatted],
      done: defaultDaysBonus[formatted].done + 1,
    };
  }
  result.bonuses.days = Object.values(defaultDaysBonus);
  result.bonuses.totalData.done = bonuses.length;
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

  let grouped = await Payment.aggregate([
    {
      $match: {
        account: {
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
        _id: "$account",
      },
    },
  ]);
  while (isDateInRange(countDate, startDate, endDate)) {
    const formatted = format(countDate, "dd/MM/yyyy");
    days[formatted] = {
      date: formatted,
      done: 0,
    };
    countDate = addDaysToDate(countDate, 1);
  }
  const groupedSize = grouped.length;

  grouped = grouped.map((result, index) => {
    groupedMap[result._id] = index;
    return { account: result._id, days: structuredClone(days), total: 0 };
  });
  groupedMap["CASH"] = groupedSize;
  groupedMap["CASH_OFFICE"] = groupedSize + 1;
  grouped.push({ method: "CASH", days: structuredClone(days), total: 0 });
  grouped.push({ method: "CASH_OFFICE", days: structuredClone(days), total: 0 });
  const payments = await Payment.find({
    method: { $in: ["DEP", "TRANSFER", "CASH", "CASH_OFFICE"] },
    date: { $gte: startDate, $lte: endDate },
  });
  payments.forEach((payment) => {
    const formatted = format(payment.date, "dd/MM/yyyy");
    const index = ["CASH", "CASH_OFFICE"].includes(payment.method) ? groupedMap[payment.method] : groupedMap[payment.account];
    grouped[index].days[formatted].done += payment.amount;
    grouped[index].total += payment.amount;
    TOTAL += payment.amount;
  });
  
  grouped = grouped.map((result) => {
    return { ...result, days: Object.values(result.days) };
  });
  return {
    groups: grouped.sort((a, b) => {
      if (a.account > b.account) {
        return 1;
      } else if (a.account < b.account) {
        return -1;
      } else {
        return 0;
      }
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

export async function getTechniciansReport(start, end, userId = null) {
  const weekStart = setDateToInitial(dateFromString(start));
  const weekEnd = setDateToEnd(getLastWeekDay(dateFromString(end)));
  
  // Find TEC role
  const tecRole = await Role.findOne({ id: 'TEC' }).lean();
  if (!tecRole) {
    throw new Error('TEC role not found');
  }
  // Get all active technician users with their machine ranges
  
  const technicians = userId ? [await User.findById(userId).lean()] : await User.find({
    isActive: true,
    role: tecRole._id
  })
  .select('_id name startM endM tecPay')
  .lean();
  const technicianReports = await Promise.all(
    technicians.map(async (tech) => {
      // Get all machines in technician's range
      const machinesInRange = await Machine.find({
        machineNum: { $gte: tech.startM, $lte: tech.endM },
        active: true
      })
      .select('_id machineNum')
      .lean();
      
      const machineIds = machinesInRange.map(m => m._id);
      
      if (machineIds.length === 0) {
        return {
          technician: {
            _id: tech._id,
            name: tech.name,
            range: `${tech.startM} - ${tech.endM}`
          },
          machines: []
        };
      }
      
      // Find machines with at least one completed maintenance and get latest maintenance date
      const latestMaintenances = await Mantainance.aggregate([
        {
          $match: {
            machine: { $in: machineIds },
            status: 'FINALIZADO'
          }
        },
        {
          $sort: { finishedAt: -1 }
        },
        {
          $group: {
            _id: '$machine',
            latestMaintenance: { $first: '$$ROOT' }
          }
        }
      ]);
      
      // TEMPORARILY COMMENTED - Remove maintenance validation
      // if (latestMaintenances.length === 0) {
      //   return {
      //     technician: {
      //       _id: tech._id,
      //       name: tech.name,
      //       range: `${tech.startM} - ${tech.endM}`
      //     },
      //     machines: []
      //   };
      // }
      
      // const machinesWithMaintenance = latestMaintenances.map(m => m._id);
      
      // Find machines with latest change in selected week
      const changesInWeek = await RentChange.find({
        pickedMachine: { $in: machineIds },
        createdAt: { $gte: weekStart, $lte: weekEnd }
      })
      .select('pickedMachine createdAt problemDesc solutionDesc status wasFixed')
      .populate('pickedMachine', 'machineNum')
      .sort({ createdAt: -1 })
      .lean();
      
      // Group changes by machine and get the latest one
      const latestChangesByMachine = {};
      changesInWeek.forEach(change => {
        const machineId = change.pickedMachine._id.toString();
        if (!latestChangesByMachine[machineId]) {
          latestChangesByMachine[machineId] = change;
        }
      });
      
      const machinesWithChanges = Object.keys(latestChangesByMachine);
      
      // Get latest RENT or CHANGE movement for each machine (only if there are changes)
      let latestMovements = [];
      if (machinesWithChanges.length > 0) {
        latestMovements = await MachineMovement.aggregate([
        {
          $match: {
            machine: { $in: machinesWithChanges.map(id => require('mongoose').Types.ObjectId(id)) },
            type: { $in: ['RENT', 'CHANGE'] }
          }
        },
        {
          $sort: { date: -1 }
        },
        {
          $group: {
            _id: '$machine',
            latestMovement: { $first: '$$ROOT' }
          }
        }
      ]);
      }
      
      // Filter machines where (change date - latest movement date) < 15 days
      const qualifiedMachines = [];
      
      for (const machineId of machinesWithChanges) {
        const change = latestChangesByMachine[machineId];
        const movementData = latestMovements.find(m => m._id.toString() === machineId);
        const maintenanceData = latestMaintenances.find(m => m._id.toString() === machineId);
        
        if (movementData && movementData.latestMovement) {
          const changeDate = new Date(change.createdAt);
          const movementDate = new Date(movementData.latestMovement.date);
          
          // Calculate days difference
          const daysDiff = Math.floor((changeDate - movementDate) / (1000 * 60 * 60 * 24));
          
          // Only include if movement date is less than 15 days before the change
          if (daysDiff >= 0 && daysDiff < 15) {
            qualifiedMachines.push({
              _id: machineId,
              machineNum: change.pickedMachine.machineNum,
              latestChange: {
                date: change.createdAt,
                problemDesc: change.problemDesc || 'N/A',
                solutionDesc: change.solutionDesc || 'N/A',
                status: change.status || 'N/A',
                wasFixed: change.wasFixed || false
              },
              latestMovementDate: movementData.latestMovement.date,
              latestMaintenanceDate: maintenanceData?.latestMaintenance?.finishedAt || null,
              daysSinceMovement: daysDiff
            });
          }
        }
      }
      
      // Sort by machine number
      qualifiedMachines.sort((a, b) => a.machineNum - b.machineNum);
      
      // Get completed maintenances for this technician in the selected week
      const techMaintenances = await Mantainance.find({
        takenBy: tech._id,
        status: 'FINALIZADO',
        finishedAt: { $gte: weekStart, $lte: weekEnd }
      })
      .populate('machine', 'machineNum')
      .select('machine finishedAt')
      .sort({ finishedAt: -1 })
      .lean();

      
      const maintenancesList = techMaintenances.map(m => ({
        machineId: m.machine._id.toString(),
        machineNum: m.machine.machineNum,
        finishedAt: m.finishedAt
      }));
      
      // Get machine IDs from qualified changes
      const machineIdsWithChanges = qualifiedMachines.map(m => m._id);
      
      // Mark maintenances with exclusion flag and filter payable ones
      const maintenancesWithExclusion = maintenancesList.map(m => ({
        ...m,
        excludedFromPayment: machineIdsWithChanges.includes(m.machineId)
      }));
      
      const payableMaintenances = maintenancesWithExclusion.filter(
        m => !m.excludedFromPayment
      );
      
      // Calculate payment
      const totalPayment = payableMaintenances.length * (tech.tecPay || 0);
      
      return {
        technician: {
          _id: tech._id,
          name: tech.name,
          range: `${tech.startM} - ${tech.endM}`,
          tecPay: tech.tecPay || 0
        },
        machines: qualifiedMachines,
        totalMachines: qualifiedMachines.length,
        completedMaintenances: maintenancesWithExclusion,
        totalMaintenances: maintenancesWithExclusion.length,
        payableMaintenances: payableMaintenances.length,
        totalPayment: totalPayment
      };
    })
  );
  
  // Filter out technicians with no data and sort by name
  const reportWithData = technicianReports
    .filter(report => 
      (report.machines && report.machines.length > 0) || 
      (report.completedMaintenances && report.completedMaintenances.length > 0)
    )
    .sort((a, b) => a.technician.name.localeCompare(b.technician.name));
  
  // Calculate totals
  const totalMachinesWithChanges = reportWithData.reduce((sum, t) => sum + (t.totalMachines || 0), 0);
  const totalMaintenances = reportWithData.reduce((sum, t) => sum + (t.totalMaintenances || 0), 0);
  
  return {
    weekStart,
    weekEnd,
    technicians: reportWithData,
    totalTechnicians: reportWithData.length,
    totalMachines: totalMachinesWithChanges,
    totalMaintenances: totalMaintenances
  };
}
