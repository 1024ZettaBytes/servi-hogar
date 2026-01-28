import { TechnicianWeeklyBonus } from '../models/TechnicianWeeklyBonus';
import { Mantainance } from '../models/Mantainance';
import { setDateToInitial, setDateToEnd, dateFromString } from '../client/utils';
import dayjs from 'dayjs';

const PUNCTUALITY_BONUS = 125;
const REPAIR_BONUS = 100;

/**
 * Get or create bonus record for a technician in a specific week
 */
export async function getTechnicianBonuses(technicianId, weekStart, weekEnd) {
  const startDate = setDateToInitial(dateFromString(weekStart));
  const endDate = setDateToEnd(dateFromString(weekEnd));

  let bonus = await TechnicianWeeklyBonus.findOne({
    technician: technicianId,
    weekStart: startDate
  }).lean();

  if (!bonus) {
    // Calculate repair bonus for new record
    const repairBonusData = await calculateRepairBonus(technicianId, startDate, endDate);
    
    bonus = await TechnicianWeeklyBonus.create({
      technician: technicianId,
      weekStart: startDate,
      weekEnd: endDate,
      punctualityBonus: {
        amount: PUNCTUALITY_BONUS,
        active: true
      },
      repairBonus: {
        amount: REPAIR_BONUS,
        active: repairBonusData.eligible,
        totalMaintenances: repairBonusData.totalMaintenances,
        completedMaintenances: repairBonusData.completedMaintenances
      }
    });
    bonus = bonus.toObject();
  }

  return bonus;
}

/**
 * Get bonuses for multiple technicians
 */
export async function getAllTechnicianBonuses(technicianIds, weekStart, weekEnd) {
  const startDate = setDateToInitial(dateFromString(weekStart));
  const endDate = setDateToEnd(dateFromString(weekEnd));

  const bonuses = {};
  
  for (const techId of technicianIds) {
    bonuses[techId.toString()] = await getTechnicianBonuses(techId, weekStart, weekEnd);
  }
  
  return bonuses;
}

/**
 * Calculate if technician is eligible for repair bonus
 * Rules:
 * - Week starts on Friday
 * - Get maintenances CREATED from Friday to Wednesday (day 0 to day 5)
 * - Check if all are completed by Thursday end (day 6)
 * - If all completed, bonus is active
 */
export async function calculateRepairBonus(technicianId, weekStart, weekEnd) {
  // Wednesday end of day (Friday + 5 days)
  const wednesdayEnd = setDateToEnd(dayjs(weekStart).add(5, 'day').toDate());
  // Thursday end of day (deadline to complete - Friday + 6 days)
  const thursdayEnd = setDateToEnd(dayjs(weekStart).add(6, 'day').toDate());
  
  // Find maintenances CREATED from Monday to Wednesday for this technician
  const maintenancesCreated = await Mantainance.find({
    takenBy: technicianId,
    createdAt: { $gte: weekStart, $lte: wednesdayEnd }
  }).lean();
  
  const totalMaintenances = maintenancesCreated.length;
  
  if (totalMaintenances === 0) {
    // No maintenances created, bonus is active by default
    return {
      eligible: true,
      totalMaintenances: 0,
      completedMaintenances: 0
    };
  }
  
  // Count how many are completed by Thursday
  const completedMaintenances = maintenancesCreated.filter(m => 
    m.status === 'FINALIZADO' && 
    m.finishedAt && 
    new Date(m.finishedAt) <= thursdayEnd
  ).length;
  
  return {
    eligible: completedMaintenances === totalMaintenances,
    totalMaintenances,
    completedMaintenances
  };
}

/**
 * Update a technician's bonus (toggle punctuality bonus)
 */
export async function updateTechnicianBonus({ technicianId, weekStart, bonusType, active }) {
  const startDate = setDateToInitial(dateFromString(weekStart));
  
  const updateField = bonusType === 'punctuality' 
    ? { 'punctualityBonus.active': active }
    : { 'repairBonus.active': active };
  
  const updated = await TechnicianWeeklyBonus.findOneAndUpdate(
    { technician: technicianId, weekStart: startDate },
    { $set: updateField },
    { new: true }
  ).lean();
  
  return updated;
}

/**
 * Recalculate repair bonus for a technician (can be called to refresh)
 */
export async function recalculateRepairBonus(technicianId, weekStart, weekEnd) {
  const startDate = setDateToInitial(dateFromString(weekStart));
  const endDate = setDateToEnd(dateFromString(weekEnd));
  
  const repairBonusData = await calculateRepairBonus(technicianId, startDate, endDate);
  
  const updated = await TechnicianWeeklyBonus.findOneAndUpdate(
    { technician: technicianId, weekStart: startDate },
    { 
      $set: {
        'repairBonus.active': repairBonusData.eligible,
        'repairBonus.totalMaintenances': repairBonusData.totalMaintenances,
        'repairBonus.completedMaintenances': repairBonusData.completedMaintenances
      }
    },
    { new: true, upsert: true }
  ).lean();
  
  return updated;
}
