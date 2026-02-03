import { getUserId, getUserRole } from '../auth/authUtils';
import { getWeeklyPayrollData, saveWeeklyPayrollData } from '../../../lib/data/Payroll';

async function getWeeklyAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;
    
    const currentUserId = await getUserId(req);
    const { userId, date } = req.query;
    
    // AUX users can only see their own payroll
    if (userRole === 'AUX' && userId && userId !== currentUserId) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }
    
    // Only ADMIN and AUX can access this endpoint
    if (!['ADMIN', 'AUX'].includes(userRole)) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }
    
    const targetUserId = userRole === 'ADMIN' && userId ? userId : currentUserId;
    
    const payrollData = await getWeeklyPayrollData(targetUserId, date);
    
    res.status(200).json({ data: payrollData });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar la nómina. Por favor intente de nuevo.'
    });
  }
}

async function saveWeeklyAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;
    
    // Only ADMIN can save weekly payroll
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ errorMsg: 'No tienes permisos para hacer esto' });
    }
    
    const currentUserId = await getUserId(req);
    const {
      userId,
      weekStart,
      weekEnd,
      punctualityBonusApplied,
      restDays,
      extraDeductions,
      extraPerceptions,
      notes
    } = req.body;
    
    if (!userId || !weekStart || !weekEnd) {
      return res.status(400).json({ errorMsg: 'Faltan campos requeridos' });
    }
    
    await saveWeeklyPayrollData({
      userId,
      weekStart,
      weekEnd,
      punctualityBonusApplied,
      restDays,
      extraDeductions,
      extraPerceptions,
      notes,
      lastUpdatedBy: currentUserId
    });
    
    res.status(200).json({ msg: '¡Nómina semanal guardada con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await getWeeklyAPI(req, res);
      break;
    case 'POST':
      await saveWeeklyAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
