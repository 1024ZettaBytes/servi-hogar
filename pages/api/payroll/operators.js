import { getUserId, getUserRole } from '../auth/authUtils';
import { getOperatorsWeeklyPayroll } from '../../../lib/data/Payroll';

async function getOperatorsPayrollAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;

    const userId = await getUserId(req);
    const { date } = req.query;

    if (!['ADMIN', 'OPE'].includes(userRole)) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }

    // OPE users can only see their own payroll
    const operatorId = userRole === 'OPE' ? userId : null;

    const data = await getOperatorsWeeklyPayroll(date || new Date(), operatorId);
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar la nómina de operadores. Por favor intente de nuevo.'
    });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await getOperatorsPayrollAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
