import { getInvestigationsData } from '../../../lib/data/Pickups';
import { validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (validRole) {
    switch (req.method) {
      case 'GET':
        try {
          const { page, limit, searchTerm } = req.query;
          const investigations = await getInvestigationsData(page, limit, searchTerm);
          res.status(200).json({ data: investigations });
        } catch (e) {
          console.error(e);
          res.status(500).json({ errorMsg: e.message });
        }
        break;
      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
}
