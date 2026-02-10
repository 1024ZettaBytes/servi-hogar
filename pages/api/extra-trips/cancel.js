import { cancelExtraTrip } from '../../../lib/data/ExtraTrips';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'POST') {
    try {
      const { tripId } = req.body;
      
      const result = await cancelExtraTrip({
        tripId,
        cancelledBy: userId
      });
      
      res.status(200).json({ msg: 'Vuelta cancelada con éxito!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
