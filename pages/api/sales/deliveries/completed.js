import { getCompletedSaleDeliveriesData } from '../../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../../auth/authUtils';

export const config = { api: { bodyParser: false } };

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  if (validRole && req.method === 'GET') {
    try {
      const { date } = req.query;
      const data = await getCompletedSaleDeliveriesData(date || null);
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }
}

export default handler;
