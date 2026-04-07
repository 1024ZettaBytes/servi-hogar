import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { recordLoginAttendance, recordLogoutAttendance } from '../../../lib/data/Attendance';

async function loginAttendanceAPI(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ errorMsg: 'No autenticado' });
    }
    const { coordinates } = req.body;
    const result = await recordLoginAttendance({ userId, coordinates });
    if (result?.error) {
      return res.status(200).json({ data: null, warning: result.error });
    }
    res.status(200).json({ data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: 'Error al registrar asistencia de entrada.' });
  }
}

async function logoutAttendanceAPI(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ errorMsg: 'No autenticado' });
    }
    const { coordinates } = req.body;
    const result = await recordLogoutAttendance({ userId, coordinates });
    res.status(200).json({ data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: 'Error al registrar asistencia de salida.' });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST': {
      // sendBeacon always sends POST, so check for _method override
      if (req.body?._method === 'PUT') {
        await logoutAttendanceAPI(req, res);
      } else {
        await loginAttendanceAPI(req, res);
      }
      break;
    }
    case 'PUT':
      await logoutAttendanceAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
      break;
  }
}
