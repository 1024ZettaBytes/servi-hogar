import { getPendingExtraTrips, getPendingExtraTripsForOperator } from '../../../lib/data/ExtraTrips';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);

  if (validRole && req.method === 'GET') {
    try {
      const userRole = await getUserRole(req);
      // Operators only see extra trips assigned to them, not the unassigned (PENDIENTE) pool
      const pendingTrips =
        userRole === 'OPE'
          ? await getPendingExtraTripsForOperator(await getUserId(req))
          : await getPendingExtraTrips();
      res.status(200).json({ data: pendingTrips });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        errorMsg: 'Hubo un problema al consultar las vueltas pendientes. Por favor intente de nuevo.'
      });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
