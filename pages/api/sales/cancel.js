import { cancelSaleData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'POST') {
    try {
      const result = await cancelSaleData({ ...req.body, lastUpdatedBy: userId });
      res.status(200).json({ msg: 'Venta cancelada con éxito!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else if (!validRole) {
    res.status(403).json({ errorMsg: 'No tienes permisos para realizar esta acción' });
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
