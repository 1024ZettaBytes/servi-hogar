import { getCollectedSalesMachinesData } from '../../../lib/data/SalesMachines';
import { validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'TEC', 'AUX']);
  if (!validRole) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const collectedMachines = await getCollectedSalesMachinesData();
    res.status(200).json({ data: collectedMachines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: 'Error al consultar equipos de venta recolectados' });
  }
}
