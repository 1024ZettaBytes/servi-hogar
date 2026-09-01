import { getCompletedSaleDeliveriesData } from '../../../../lib/data/Sales';
import { validateUserPermissions, getUserId, getUserRole } from '../../auth/authUtils';

export const config = { api: { bodyParser: false } };

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  if (validRole && req.method === 'GET') {
    try {
      const { date } = req.query;
      const userRole = await getUserRole(req);

      // Only filter by operator if user is OPE
      const operatorFilter = userRole === 'OPE' ? await getUserId(req) : null;

      const data = await getCompletedSaleDeliveriesData(date || null, operatorFilter);
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }
}

export default handler;
