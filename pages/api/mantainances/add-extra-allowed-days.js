import { addMantExtraAllowedDaysData } from '../../../lib/data/Mantainances';
import { getUserId, validateUserPermissions } from '../auth/authUtils';
import { MANTAINANCE_EXTRA_ALLOWED_DAYS } from '../../../lib/consts/OBJ_CONTS';

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (req.method === 'POST') {
    try {
      const allowed = await validateUserPermissions(req, res, ['ADMIN']);
      if (!allowed) return;

      const { mantId, type } = req.body;

      if (!mantId) {
        return res.status(400).json({ error: true, msg: 'Faltan parámetros requeridos' });
      }

      await addMantExtraAllowedDaysData({
        mantId,
        type: type || 'RENT',
        extraDays: MANTAINANCE_EXTRA_ALLOWED_DAYS,
        lastUpdatedBy: userId
      });

      return res.status(200).json({
        error: false,
        msg: `Se agregaron ${MANTAINANCE_EXTRA_ALLOWED_DAYS} días permitidos exitosamente`
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: true, msg: error.message || 'Error al agregar los días permitidos' });
    }
  }
  return res.status(405).json({ error: true, msg: 'Método no permitido' });
}
