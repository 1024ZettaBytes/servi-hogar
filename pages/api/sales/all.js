import { getSalesData, getCompletedSalesForOperator } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  
  if (validRole && req.method === 'GET') {
    try {
      let allSales = [];
      
      if (userRole === 'OPE') {
        // Operators see only their completed deliveries
        allSales = await getCompletedSalesForOperator(userId);
      } else {
        // ADMIN/AUX see all completed sales
        allSales = await getSalesData();
      }
      
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
