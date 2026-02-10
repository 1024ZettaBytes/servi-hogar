import { ExtraTrip } from '../../../lib/models/ExtraTrip';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { connectDB } from '../../../lib/db';

async function scheduleExtraTripAPI(req, res, userId) {
  try {
    await connectDB();
    
    const { tripId, scheduledTime } = req.body;

    if (!tripId) {
      return res.status(400).json({ errorMsg: 'Se requiere el ID de la vuelta extra' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ errorMsg: 'Se requiere la hora programada' });
    }

    const trip = await ExtraTrip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({ errorMsg: 'Vuelta extra no encontrada' });
    }

    if (trip.status === 'COMPLETADA') {
      return res.status(400).json({ errorMsg: 'No se puede programar una vuelta extra ya completada' });
    }

    if (trip.status === 'CANCELADA') {
      return res.status(400).json({ errorMsg: 'No se puede programar una vuelta extra cancelada' });
    }

    trip.scheduledTime = new Date(scheduledTime);
    trip.updatedAt = new Date();
    trip.lastUpdatedBy = userId;

    await trip.save();

    res.status(200).json({ 
      msg: 'Hora programada correctamente',
      data: trip 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message || 'Error al programar la vuelta extra' });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);
  
  if (validRole) {
    switch (req.method) {
      case 'POST':
        await scheduleExtraTripAPI(req, res, userId);
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
  }
}

export default handler;
