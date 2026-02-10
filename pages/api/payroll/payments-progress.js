import { getUserRole } from '../auth/authUtils';
import { connectToDatabase, isConnected } from '../../../lib/db';
import { User } from '../../../lib/models/User';
import { Role } from '../../../lib/models/Role';
import { Payment } from '../../../lib/models/Payment';
import {
  getFirstWeekDay,
  getLastWeekDay,
  setDateToInitial,
  setDateToEnd,
  addDaysToDate,
  dateToPlainString
} from '../../../lib/client/utils';
import { CurrentRentsLog } from '../../../lib/models/CurrentRentsLog';

/**
 * Get payments progress for all AUX users for a specific week
 * The bonus is COLLECTIVE - if all users together reach 80% or 85%, everyone gets the bonus
 */
async function getPaymentsProgressAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;

    // Only ADMIN and AUX can access this endpoint
    if (!['ADMIN', 'AUX'].includes(userRole)) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }

    if (!isConnected()) {
      await connectToDatabase();
    }

    // Get week boundaries from query param or use current week
    const { weekStart: weekStartParam } = req.query;
    let baseDate = new Date();
    
    if (weekStartParam) {
      // Parse the date string as local date (YYYY-MM-DD)
      const [year, month, day] = weekStartParam.split('-').map(Number);
      baseDate = new Date(year, month - 1, day);
    }
    
    const weekStart = setDateToInitial(getFirstWeekDay(baseDate));
    const weekEnd = setDateToEnd(getLastWeekDay(baseDate));

    const pastWeekEnd = new Date(addDaysToDate(weekStart, -1));

    // Get all AUX users
    const auxRole = await Role.findOne({ id: 'AUX' });
    if (!auxRole) {
      return res.status(200).json({ data: { users: [], totalActiveRents: 0 } });
    }

    const auxUsers = await User.find({ role: auxRole._id, isActive: true })
      .select({ _id: 1, id: 1, name: 1 })
      .lean();

    const activeRentLog = await CurrentRentsLog.findOne({ dateText: dateToPlainString(pastWeekEnd) }).lean();
    if(!activeRentLog) {
      return res.status(500).json({ errorMsg: `No se encontró el registro de rentas activas para la semana pasada ${dateToPlainString(pastWeekEnd)}` });
    }
    const totalActiveRents = activeRentLog.amount;
    // Calculate targets
    const target80 = Math.ceil(totalActiveRents * 0.80);
    const target85 = Math.ceil(totalActiveRents * 0.85);

    // For each AUX user, count their RENT_EXT payments this week
    // Use weeksToPay field if exists, otherwise count as 1
    const usersProgress = await Promise.all(
      auxUsers.map(async (user) => {
        const paymentAggregation = await Payment.aggregate([
          {
            $match: {
              lastUpdatedBy: user._id,
              reason: 'RENT_EXT',
              date: {
                $gte: weekStart,
                $lte: weekEnd
              }
            }
          },
          {
            $group: {
              _id: null,
              totalWeeks: {
                $sum: {
                  $ifNull: ['$weeksToPay', 1]
                }
              }
            }
          }
        ]);

        const paymentsCount = paymentAggregation.length > 0 
          ? paymentAggregation[0].totalWeeks 
          : 0;

        return {
          _id: user._id,
          name: user.name,
          paymentsCount
        };
      })
    );

    // Calculate TOTAL payments from all AUX users (collective)
    const totalPayments = usersProgress.reduce((sum, user) => sum + user.paymentsCount, 0);
    
    // Calculate collective percentage and bonus
    const collectivePercentage = totalActiveRents > 0 
      ? (totalPayments / totalActiveRents) * 100 
      : 0;
    
    // Collective bonus - everyone gets this if the team reaches the goal
    let collectiveBonus = 0;
    let collectiveBonusType = null;
    if (collectivePercentage >= 85) {
      collectiveBonus = 500;
      collectiveBonusType = '85%';
    } else if (collectivePercentage >= 80) {
      collectiveBonus = 300;
      collectiveBonusType = '80%';
    }

    // How many more payments needed for each target (collective)
    const remainingFor80 = Math.max(0, target80 - totalPayments);
    const remainingFor85 = Math.max(0, target85 - totalPayments);

    // Sort by payments count descending
    usersProgress.sort((a, b) => b.paymentsCount - a.paymentsCount);

    res.status(200).json({
      data: {
        users: usersProgress,
        totalActiveRents,
        totalPayments,
        collectivePercentage: Math.round(collectivePercentage * 100) / 100,
        collectiveBonus,
        collectiveBonusType,
        target80,
        target85,
        remainingFor80,
        remainingFor85,
        weekStart,
        weekEnd
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar el progreso. Por favor intente de nuevo.'
    });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await getPaymentsProgressAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
