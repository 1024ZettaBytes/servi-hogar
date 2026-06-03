import { validateUserPermissions } from '../../../auth/authUtils';
import { getCompletedSaleChangesData } from '../../../../../lib/data/SaleChanges';

export const config = {
  api: {
    bodyParser: false
  }
};

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  if (validRole && req.method === 'GET') {
    try {
      const { date } = req.query;
      const changes = await getCompletedSaleChangesData(date || null);
      res.status(200).json({ data: changes });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }
}

export default handler;
