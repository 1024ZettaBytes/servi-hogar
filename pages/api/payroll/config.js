import { getUserId, getUserRole } from '../auth/authUtils';
import { getPayrollConfigData, savePayrollConfigData } from '../../../lib/data/Payroll';

async function getConfigAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;
    
    const currentUserId = await getUserId(req);
    const { userId } = req.query;
    
    // AUX users can only see their own config
    if (userRole === 'AUX' && userId && userId !== currentUserId) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }
    
    // Only ADMIN and AUX can access this endpoint
    if (!['ADMIN', 'AUX'].includes(userRole)) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }
    
    const targetUserId = userRole === 'ADMIN' && userId ? userId : currentUserId;
    const config = await getPayrollConfigData(targetUserId);
    
    res.status(200).json({ data: config });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar la configuración. Por favor intente de nuevo.'
    });
  }
}

async function saveConfigAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;
    
    // Only ADMIN can save config
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ errorMsg: 'No tienes permisos para hacer esto' });
    }
    
    const {
      userId,
      baseSalary,
      baseSalaryDescription,
      punctualityBonusAmount,
      restDayDeductionAmount,
      hireDate,
      vacationDaysPerYear,
      vacationDaysUsed,
      collectionBonusEnabled
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({ errorMsg: 'El usuario es requerido' });
    }
    
    await savePayrollConfigData({
      userId,
      baseSalary,
      baseSalaryDescription,
      punctualityBonusAmount,
      restDayDeductionAmount,
      hireDate,
      vacationDaysPerYear,
      vacationDaysUsed,
      collectionBonusEnabled
    });
    
    res.status(200).json({ msg: '¡Configuración guardada con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await getConfigAPI(req, res);
      break;
    case 'POST':
      await saveConfigAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
