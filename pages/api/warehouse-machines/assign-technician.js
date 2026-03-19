import { assignTechnicianData } from '../../../lib/data/WarehouseMachines';
import { getUserId, validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (req.method === 'POST') {
    try {
      const allowed = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
      if (!allowed) return;

      const { warehouseMachineId, technicianId, warehouseId } = req.body;

      if (!warehouseMachineId || !technicianId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const result = await assignTechnicianData({
        warehouseMachineId,
        technicianId,
        warehouseId: warehouseId || null,
        lastUpdatedBy: userId
      });
      return res.status(200).json({
        result,
        msg: 'Técnico asignado exitosamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
}
