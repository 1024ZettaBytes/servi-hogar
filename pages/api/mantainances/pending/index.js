import { validateUserPermissions, getUserId } from '../../auth/authUtils';
import {
  getMantData,
  completeMantainanceData
} from '../../../../lib/data/Mantainances';
async function getPendingMantAPI(req, res, userId) {
  try {
    const mants = await getMantData(userId, true);
    res.status(200).json({ data: mants });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completeMantainanceAPI(req, res, userId) {
  try {
    await completeMantainanceData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'El mantenimiento ha sido completado.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
  switch (req.method) {
    case 'GET':
      await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
      await getPendingMantAPI(req, res, userId);
      break;
    case 'POST':
      break;
    case 'PUT':
      await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
      await completeMantainanceAPI(req, res, userId);
      break;
    case 'DELETE':
      break;
  }
}

export default handler;
