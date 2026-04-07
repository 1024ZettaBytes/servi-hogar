import { validateUserPermissions } from '../auth/authUtils';
import { getAttendanceByUser } from '../../../lib/data/Attendance';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (!validRole) return;

  try {
    const { userId, startDate, endDate } = req.query;
    if (!userId) {
      return res.status(400).json({ errorMsg: 'Se requiere el ID del usuario.' });
    }
    const records = await getAttendanceByUser({
      userId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });
    res.status(200).json({ data: records });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: 'Error al consultar la asistencia.' });
  }
}
