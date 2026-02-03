import { connectToDatabase, isConnected } from '../db';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Sale } from '../models/Sale';
import { AuxPayrollConfig } from '../models/AuxPayrollConfig';
import { AuxWeeklyPayroll } from '../models/AuxWeeklyPayroll';
import {
  getFirstWeekDay,
  getLastWeekDay,
  setDateToInitial,
  setDateToEnd,
  dateFromString
} from '../client/utils';
import { format } from 'date-fns';
import { Customer } from '../models/Customer';

const SALES_COMMISSION_PER_SALE = 200;

// Helper to format date as YYYY-MM-DD string
const formatDateString = (date) => format(new Date(date), 'yyyy-MM-dd');

Customer.init();
AuxPayrollConfig.init();
AuxWeeklyPayroll.init();

/**
 * Get all users with AUX role
 */
export async function getAuxUsersData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const auxRole = await Role.findOne({ id: 'AUX' });
  if (!auxRole) {
    return [];
  }
  const users = await User.find({ role: auxRole._id, isActive: true })
    .select({ _id: 1, id: 1, name: 1 })
    .lean();
  return users;
}

/**
 * Get payroll config for a specific user
 */
export async function getPayrollConfigData(userId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const config = await AuxPayrollConfig.findOne({ user: userId })
    .populate('user', '_id id name')
    .lean();
  return config;
}

/**
 * Save or update payroll config for a user
 */
export async function savePayrollConfigData({
  userId,
  baseSalary,
  baseSalaryDescription,
  punctualityBonusAmount,
  restDayDeductionAmount,
  hireDate,
  vacationDaysPerYear,
  vacationDaysUsed,
  collectionBonusEnabled
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const currentDate = new Date();
  
  const existingConfig = await AuxPayrollConfig.findOne({ user: userId });
  
  if (existingConfig) {
    existingConfig.baseSalary = baseSalary;
    existingConfig.baseSalaryDescription = baseSalaryDescription || 'SUELDO BASE';
    existingConfig.punctualityBonusAmount = punctualityBonusAmount;
    existingConfig.restDayDeductionAmount = restDayDeductionAmount;
    existingConfig.hireDate = hireDate;
    existingConfig.vacationDaysPerYear = vacationDaysPerYear;
    existingConfig.vacationDaysUsed = vacationDaysUsed;
    existingConfig.collectionBonusEnabled = collectionBonusEnabled;
    existingConfig.updatedAt = currentDate;
    await existingConfig.save();
    return existingConfig;
  } else {
    const newConfig = new AuxPayrollConfig({
      user: userId,
      baseSalary,
      baseSalaryDescription: baseSalaryDescription || 'SUELDO BASE',
      punctualityBonusAmount,
      restDayDeductionAmount,
      hireDate,
      vacationDaysPerYear,
      vacationDaysUsed,
      collectionBonusEnabled: collectionBonusEnabled || false,
      createdAt: currentDate,
      updatedAt: currentDate
    });
    await newConfig.save();
    return newConfig;
  }
}

/**
 * Calculate sales commission for a user in a given week
 * Also returns the list of sales with customer info
 */
async function calculateSalesCommission(userId, weekStart, weekEnd) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const sales = await Sale.find({
    createdBy: userId,
    saleDate: {
      $gte: setDateToInitial(weekStart),
      $lte: setDateToEnd(weekEnd)
    },
    status: { $in: ['ACTIVA', 'PAGADA'] }
  })
    .populate('customer', 'name')
    .select('saleNum customer saleDate')
    .lean();
  
  const salesCount = sales.length;
  const salesList = sales.map(sale => ({
    saleNum: sale.saleNum,
    customerName: sale.customer?.name || 'Cliente desconocido',
    saleDate: sale.saleDate
  }));
  
  return {
    salesCount,
    salesCommission: salesCount * SALES_COMMISSION_PER_SALE,
    salesList
  };
}

/**
 * Get weekly payroll data for a user
 */
export async function getWeeklyPayrollData(userId, date = new Date()) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  // Parse date and get week boundaries
  const inputDate = dateFromString(date);
  const weekStart = getFirstWeekDay(inputDate);
  const weekEnd = getLastWeekDay(inputDate);
  
  // Use string format for database queries (YYYY-MM-DD)
  const weekStartStr = formatDateString(weekStart);
  const weekEndStr = formatDateString(weekEnd);
  
  // Get user info
  const user = await User.findById(userId)
    .select({ _id: 1, id: 1, name: 1 })
    .lean();
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  // Get payroll config
  const config = await AuxPayrollConfig.findOne({ user: userId }).lean();
  
  // Get weekly payroll record using string comparison
  let weeklyPayroll = await AuxWeeklyPayroll.findOne({
    user: userId,
    weekStart: weekStartStr
  }).lean();
  
  // Calculate sales commission (always recalculate for accuracy)
  const { salesCount, salesCommission, salesList } = await calculateSalesCommission(
    userId,
    weekStart,
    weekEnd
  );
  
  // Calculate seniority (years since hire date)
  let seniority = 0;
  let vacationDaysRemaining = 0;
  if (config?.hireDate) {
    const hireDate = new Date(config.hireDate);
    const now = new Date();
    seniority = Math.floor((now.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    vacationDaysRemaining = (config.vacationDaysPerYear || 0) - (config.vacationDaysUsed || 0);
  }
  
  // Build response - return dates as strings
  const response = {
    user,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    config: config || null,
    weeklyData: weeklyPayroll || {
      punctualityBonusApplied: true,
      restDays: [],
      extraDeductions: [],
      extraPerceptions: [],
      notes: ''
    },
    calculated: {
      salesCount,
      salesCommission,
      salesList,
      seniority,
      vacationDaysRemaining
    }
  };
  
  return response;
}

/**
 * Save or update weekly payroll data
 */
export async function saveWeeklyPayrollData({
  userId,
  weekStart,
  weekEnd,
  punctualityBonusApplied,
  restDays,
  extraDeductions,
  extraPerceptions,
  notes,
  lastUpdatedBy
}) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const currentDate = new Date();
  
  // Convert weekStart/weekEnd to YYYY-MM-DD strings
  // If already a string in correct format, use directly
  // If Date object, format it
  const weekStartStr = typeof weekStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)
    ? weekStart
    : formatDateString(weekStart);
  const weekEndStr = typeof weekEnd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekEnd)
    ? weekEnd
    : formatDateString(weekEnd);
  
  // For sales commission calculation, we need Date objects
  const weekStartDate = new Date(weekStartStr + 'T12:00:00');
  const weekEndDate = new Date(weekEndStr + 'T12:00:00');
  
  // Calculate sales commission
  const { salesCount, salesCommission } = await calculateSalesCommission(
    userId,
    weekStartDate,
    weekEndDate
  );
  
  // Get existing payroll to calculate vacation days difference
  const existingPayroll = await AuxWeeklyPayroll.findOne({
    user: userId,
    weekStart: weekStartStr
  });
  
  // Count vacation days in the new data
  const newVacationDays = (restDays || []).filter(rd => rd.type === 'VACACIONES').length;
  
  // Count vacation days in the existing data
  const oldVacationDays = existingPayroll?.restDays?.filter(rd => rd.type === 'VACACIONES').length || 0;
  
  // Calculate the difference in vacation days
  const vacationDaysDiff = newVacationDays - oldVacationDays;
  
  // Update vacation days used in config if there's a difference
  if (vacationDaysDiff !== 0) {
    const config = await AuxPayrollConfig.findOne({ user: userId });
    if (config) {
      config.vacationDaysUsed = Math.max(0, (config.vacationDaysUsed || 0) + vacationDaysDiff);
      config.updatedAt = currentDate;
      await config.save();
    }
  }
  
  // Format restDays dates as strings
  const formattedRestDays = (restDays || []).map(rd => ({
    ...rd,
    date: typeof rd.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rd.date)
      ? rd.date
      : formatDateString(rd.date)
  }));
  
  // Use findOneAndUpdate with upsert for more reliable save
  const updateData = {
    punctualityBonusApplied: punctualityBonusApplied !== false,
    restDays: formattedRestDays,
    extraDeductions: extraDeductions || [],
    extraPerceptions: extraPerceptions || [],
    salesCount,
    salesCommission,
    notes: notes || '',
    updatedAt: currentDate,
    lastUpdatedBy
  };
  
  const result = await AuxWeeklyPayroll.findOneAndUpdate(
    {
      user: userId,
      weekStart: weekStartStr
    },
    {
      $set: updateData,
      $setOnInsert: {
        user: userId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        createdAt: currentDate
      }
    },
    {
      upsert: true,
      new: true
    }
  );
  
  return result;
}