import { reassignMantTechnicianData } from '../../../lib/data/Mantainances';
import { getUserId, validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (req.method === 'POST') {
    try {
      const allowed = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
      if (!allowed) return;

      const { mantId, technicianId, type } = req.body;

      if (!mantId || !technicianId) {
        return res.status(400).json({ error: true, msg: 'Faltan parámetros requeridos' });
      }

      await reassignMantTechnicianData({
        mantId,
        technicianId,
        type: type || 'RENT',
        lastUpdatedBy: userId
      });

      return res.status(200).json({
        error: false,
        msg: 'Técnico reasignado exitosamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: true, msg: error.message || 'Error al reasignar técnico' });
    }
  }
  return res.status(405).json({ error: true, msg: 'Método no permitido' });
}
