import { getCompletedExtraTrips } from '../../../lib/data/ExtraTrips';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  
  if (validRole && req.method === 'GET') {
    try {
      const { date } = req.query;
      const userRole = await getUserRole(req);

      // Only filter by operator if user is OPE
      const operatorFilter = userRole === 'OPE' ? await getUserId(req) : null;

      const completedTrips = await getCompletedExtraTrips(
        date || new Date().toISOString(),
        operatorFilter
      );
      res.status(200).json({ data: completedTrips });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        errorMsg: 'Hubo un problema al consultar las vueltas completadas. Por favor intente de nuevo.'
      });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
