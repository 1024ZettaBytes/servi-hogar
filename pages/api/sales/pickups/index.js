import {
  getPastSalePickupsData,
  saveSalePickupData,
  cancelSalePickupData,
  assignSalePickupData
} from '../../../../lib/data/SalePickups';
import { validateUserPermissions, getUserId, getUserRole } from '../../auth/authUtils';

async function getSalePickupsAPI(req, res) {
  try {
    const { page, limit, searchTerm, date } = req.query;
    const userId = await getUserId(req);
    const userRole = await getUserRole(req);
    
    // Only filter by operator if user is OPE
    const operatorFilter = userRole === 'OPE' ? userId : null;
    
    const pickups = await getPastSalePickupsData(page, limit, searchTerm, date, operatorFilter);
    res.status(200).json({ data: pickups });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function saveSalePickupAPI(req, res, userId) {
  try {
    const newPickup = await saveSalePickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: '¡Recolección de garantía creada!', pickup: newPickup });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function assignSalePickupAPI(req, res, userId) {
  try {
    await assignSalePickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: '¡Recolección asignada con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelSalePickupAPI(req, res, userId) {
  try {
    await cancelSalePickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'Recolección cancelada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getSalePickupsAPI(req, res);
        break;
      case 'POST':
        await saveSalePickupAPI(req, res, userId);
        return;
      case 'PUT':
        await assignSalePickupAPI(req, res, userId);
        break;
      case 'DELETE':
        await cancelSalePickupAPI(req, res, userId);
        return;
    }
}

export default handler;
