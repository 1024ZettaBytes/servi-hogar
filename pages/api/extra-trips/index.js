import { getExtraTripsData, saveExtraTripData } from '../../../lib/data/ExtraTrips';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function getAllExtraTripsAPI(req, res) {
  try {
    const allTrips = await getExtraTripsData();
    res.status(200).json({ data: allTrips });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar las vueltas extra. Por favor intente de nuevo.'
    });
  }
}

async function saveExtraTripAPI(req, res, userId) {
  try {
    const result = await saveExtraTripData({ ...req.body, createdBy: userId });
    res.status(200).json({ msg: 'Vuelta extra registrada con éxito!', data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  
  if (validRole) {
    switch (req.method) {
      case 'GET':
        await getAllExtraTripsAPI(req, res);
        break;
      case 'POST':
        // Only ADMIN and AUX can create extra trips
        const canCreate = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
        if (canCreate) {
          await saveExtraTripAPI(req, res, userId);
        }
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
  }
}

export default handler;
