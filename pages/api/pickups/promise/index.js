import { validateUserPermissions, getUserId } from '../../auth/authUtils';
import { savePickupPromiseData } from '../../../../lib/data/Pickups';

async function savePickupPromise(req, res, userId) {
  try {
    await savePickupPromiseData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'Promesa de pago guardada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, [
    'ADMIN',
    'OPE',
    'AUX'
  ]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        break;
      case 'POST':
        break;
      case 'PUT':
        await savePickupPromise(req, res, userId);
        break;
      case 'DELETE':
        break;
    }
}

export default handler;
