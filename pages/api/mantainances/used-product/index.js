import {
  validateUserPermissions,
  getUserId,
} from '../../auth/authUtils';
import { addUsedProductData } from '../../../../lib/data/Mantainances';

async function addUsedProductAPI(req, res, userId) {
  try {
    await addUsedProductData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La refacción ha sido agregada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
  switch (req.method) {
    case 'GET':
      break;
    case 'POST':
      await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
      await addUsedProductAPI(req, res, userId);
      break;
    case 'PUT':
      break;
    case 'DELETE':
      break;
  }
}

export default handler;
