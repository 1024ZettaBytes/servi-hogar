import { getCompletedCollectionsData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);

  if (validRole && req.method === "GET") {
    try {
      const { page, limit, date } = req.query;
      
      const operatorFilter = userRole === 'OPE' ? userId : null;

      const data = await getCompletedCollectionsData(
        parseInt(page) || 1, 
        parseInt(limit) || 1000, 
        date, 
        operatorFilter
      );
      
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: "Método no permitido" });
  }
}

export default handler;