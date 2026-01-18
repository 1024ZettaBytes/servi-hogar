import { validateUserPermissions } from '../auth/authUtils';
import {
  getTechnicianBonuses,
  updateTechnicianBonus,
  calculateRepairBonus
} from '../../../lib/data/TechnicianBonuses';

async function getBonusesAPI(req, res) {
  try {
    const { technicianId, weekStart, weekEnd } = req.query;
    const bonuses = await getTechnicianBonuses(technicianId, weekStart, weekEnd);
    res.status(200).json({ data: bonuses });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function updateBonusAPI(req, res) {
  try {
    const result = await updateTechnicianBonus(req.body);
    res.status(200).json({ msg: '¡Bono actualizado con éxito!', data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      // Both ADMIN and TEC can view bonuses
      const validRoleGet = await validateUserPermissions(req, res, ['ADMIN', 'TEC']);
      if (validRoleGet) await getBonusesAPI(req, res);
      break;
    case 'PUT':
      // Only ADMIN can update bonuses
      const validRolePut = await validateUserPermissions(req, res, ['ADMIN']);
      if (validRolePut) await updateBonusAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Method not allowed' });
  }
}

export default handler;
