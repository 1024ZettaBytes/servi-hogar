import { setMantAllowedDaysData } from '../../../lib/data/Mantainances';
import { getUserId, validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (req.method === 'POST') {
    try {
      const allowed = await validateUserPermissions(req, res, ['ADMIN']);
      if (!allowed) return;

      const { mantId, type, allowedDays } = req.body;

      if (!mantId || allowedDays === undefined || allowedDays === null) {
        return res.status(400).json({ error: true, msg: 'Faltan parámetros requeridos' });
      }

      await setMantAllowedDaysData({
        mantId,
        type: type || 'RENT',
        allowedDays,
        lastUpdatedBy: userId
      });

      return res.status(200).json({
        error: false,
        msg: 'Días permitidos actualizados exitosamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: true, msg: error.message || 'Error al actualizar los días permitidos' });
    }
  }
  return res.status(405).json({ error: true, msg: 'Método no permitido' });
}
