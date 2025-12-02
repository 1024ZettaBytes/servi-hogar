import { validateUserPermissions, getUserId } from '../../../auth/authUtils';
import {
  addUsedProductToSaleRepair,
  removeUsedProductFromSaleRepair
} from '../../../../../lib/data/SaleRepairs';

async function addUsedProductAPI(req, res, userId) {
  try {
    await addUsedProductToSaleRepair({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La refacción ha sido agregada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function removeUsedProductAPI(req, res, userId) {
  try {
    await removeUsedProductFromSaleRepair({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La refacción ha sido removida' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
  switch (req.method) {
    case 'POST':
      await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
      await addUsedProductAPI(req, res, userId);
      break;
    case 'DELETE':
      await validateUserPermissions(req, res, ['ADMIN', 'TEC']);
      await removeUsedProductAPI(req, res, userId);
      break;
  }
}

export default handler;
