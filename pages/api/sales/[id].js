import { getSaleWithPayments } from '../../../lib/data/Sales';
import { validateUserPermissions } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  
  if (validRole && req.method === 'GET') {
    try {
      const { id } = req.query;
      const sale = await getSaleWithPayments(id);
      
      if (!sale) {
        res.status(404).json({ errorMsg: 'Venta no encontrada' });
        return;
      }
      
      res.status(200).json({ data: sale });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
