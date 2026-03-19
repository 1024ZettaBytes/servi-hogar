import { receiveWarehouseMachineData } from '../../../lib/data/WarehouseMachines';
import { getUserId, getUserRole } from '../auth/authUtils';

export default async function handler(req, res) {
  const userId = await getUserId(req);
  const role = await getUserRole(req, res);
  if (!['ADMIN', 'AUX'].includes(role)) {
    return res.status(403).json({ error: 'No tiene permisos para esta acción' });
  }
  if (req.method === 'POST') {
    try {
      const { warehouseMachineId, warehouseId } = req.body;
      const result = await receiveWarehouseMachineData({
        warehouseMachineId,
        warehouseId,
        lastUpdatedBy: userId
      });
      return res.status(200).json({
        result,
        msg: 'Máquina recibida en almacén exitosamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
