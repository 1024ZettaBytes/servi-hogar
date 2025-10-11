import { getSalesData } from '../../../lib/data/Sales';
import { validateUserPermissions } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  
  if (validRole && req.method === 'GET') {
    try {
      const allSales = await getSalesData();
      res.status(200).json({ data: allSales });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        errorMsg: 'Hubo un problema al consultar las ventas. Por favor intente de nuevo.'
      });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
