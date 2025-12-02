import {
  validateUserPermissions,
  getUserId,
  getUserRole
} from '../../auth/authUtils';
import {
  getSaleRepairById,
  cancelSaleRepairData,
  completeSaleRepairData
} from '../../../../lib/data/SaleRepairs';

async function getSaleRepairByIdAPI(req, res, userId) {
  try {
    const userRole = await getUserRole(req, res);
    const repair = await getSaleRepairById(
      req.query.repairId,
      userRole !== 'ADMIN' ? userId : null
    );
    res.status(200).json({ data: repair });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completeSaleRepairAPI(req, res, userId) {
  try {
    await completeSaleRepairData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La reparación ha sido completada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelSaleRepairAPI(req, res, userId) {
  try {
    await cancelSaleRepairData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La reparación ha sido cancelada.' });
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
      await getSaleRepairByIdAPI(req, res, userId);
      break;
    case 'POST':
      await validateUserPermissions(req, res, ['ADMIN', 'TEC']);
      await completeSaleRepairAPI(req, res, userId);
      break;
    case 'PUT':
      await validateUserPermissions(req, res, ['ADMIN']);
      await cancelSaleRepairAPI(req, res, userId);
      break;
  }
}

export default handler;
