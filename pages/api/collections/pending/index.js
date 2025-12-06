import { getPendingCollectionsData } from '../../../../lib/data/Sales'; 
import { validateUserPermissions, getUserId, getUserRole } from '../../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);

  if (validRole && req.method === 'GET') {
    try {
      const data = await getPendingCollectionsData(userRole, userId);
      
      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errorMsg: e.message });
    }
  } else {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;