import { getSaleWithPayments, getSaleForDelivery } from '../../../lib/data/Sales';
import { validateUserPermissions } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  
  if (validRole && req.method === 'GET') {
    try {
      const { id, populate } = req.query;
      
      // If populate=full, return sale with full customer/residence data for delivery workflow
      let sale;
      if (populate === 'full') {
        sale = await getSaleForDelivery(id);
      } else {
        // Default behavior: return sale with payments
        sale = await getSaleWithPayments(id);
      }
      
      if (!sale) {
        return res.status(404).json({ errorMsg: 'Venta no encontrada' });
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
