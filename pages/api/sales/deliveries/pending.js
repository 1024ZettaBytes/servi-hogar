import { getPendingSaleDeliveriesData } from '../../../../lib/data/Sales';
import { validateUserPermissions, getUserId, getUserRole } from '../../auth/authUtils';

export const config = { api: { bodyParser: false } };

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  if (validRole && req.method === 'GET') {
    try {
      const userId = await getUserId(req);
      const userRole = await getUserRole(req);
      const data = await getPendingSaleDeliveriesData(userId, userRole);
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }
}

export default handler;
