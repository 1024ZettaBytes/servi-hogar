import { getSalesData, saveSaleData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function getAllSalesAPI(req, res) {
  try {
    const allSales = await getSalesData();
    res.status(200).json({ data: allSales });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar las ventas. Por favor intente de nuevo.'
    });
  }
}

async function saveSaleAPI(req, res, userId) {
  try {
    const result = await saveSaleData({ ...req.body, createdBy: userId });
    res.status(200).json({ msg: 'Venta registrada con éxito!', data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getAllSalesAPI(req, res);
        break;
      case 'POST':
        await saveSaleAPI(req, res, userId);
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
}

export default handler;
