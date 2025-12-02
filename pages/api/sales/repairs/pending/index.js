import { validateUserPermissions, getUserId } from '../../../auth/authUtils';
import { getSaleRepairsData } from '../../../../../lib/data/SaleRepairs';

async function getPendingSaleRepairsAPI(req, res, userId) {
  try {
    const repairs = await getSaleRepairsData(userId, true);
    res.status(200).json({ data: repairs });
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
      await getPendingSaleRepairsAPI(req, res, userId);
      break;
  }
}

export default handler;
