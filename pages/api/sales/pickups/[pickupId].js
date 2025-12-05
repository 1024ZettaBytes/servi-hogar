import { getSalePickupData } from '../../../../lib/data/SalePickups';
import { validateUserPermissions, getUserId } from '../../auth/authUtils';

async function getSalePickupByIdAPI(req, res) {
  const { pickupId } = req.query;
  try {
    const pickup = await getSalePickupData(pickupId);
    res.status(200).json({ data: pickup || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los datos de la recolección. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getSalePickupByIdAPI(req, res);
        break;
    }
}

export default handler;
