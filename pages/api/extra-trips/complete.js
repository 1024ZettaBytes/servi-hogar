import { completeExtraTrip } from '../../../lib/data/ExtraTrips';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'POST') {
    try {
      const { tripId, completionNotes } = req.body;
      
      const result = await completeExtraTrip({
        tripId,
        completionNotes,
        completedBy: userId
      });
      
      res.status(200).json({ msg: 'Vuelta completada con éxito!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
