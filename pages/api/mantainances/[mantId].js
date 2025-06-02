import {
  validateUserPermissions,
  getUserId,
  getUserRole
} from '../auth/authUtils';
import { cancelMantainanceData, getMantainanceById } from '../../../lib/data/Mantainances';

async function getMantByIdAPI(req, res, userId) {
  try {
    const userRole = await getUserRole(req, res);
    const mant = await getMantainanceById(
      req.query.mantId,
      userRole !== 'ADMIN' ? userId : null
    );
    res.status(200).json({ data: mant });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelMantainanceAPI(req, res, userId) {
  try {
    await cancelMantainanceData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'El mantenimiento ha sido cancelado.' });
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
      await getMantByIdAPI(req, res, userId);
      break;
    case 'POST':
      break;
    case 'PUT':
      await validateUserPermissions(req, res, ['ADMIN']);
      await cancelMantainanceAPI(req, res, userId);
      break;
    case 'DELETE':
      break;
  }
}

export default handler;
