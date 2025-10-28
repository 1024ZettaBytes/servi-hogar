import { getPendingSalesData, getPendingSalesForOperator, getCompletedSalesForOperator } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  
  if (validRole && req.method === 'GET') {
    try {
      let pendingSales = [];
      let completedSales = [];
      
      if (userRole === 'OPE') {
        // Operators see only their assigned pending sales and completed deliveries
        pendingSales = await getPendingSalesForOperator(userId);
        completedSales = await getCompletedSalesForOperator(userId);
        res.status(200).json({ 
          data: {
            pending: pendingSales,
            completed: completedSales
          }
        });
      } else {
        // ADMIN/AUX see all pending sales (return as array for backward compatibility)
        pendingSales = await getPendingSalesData();
        res.status(200).json({ 
          data: pendingSales
        });
      }
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
