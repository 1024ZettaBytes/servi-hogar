import { markMachineAsLost } from '../../../lib/data/Pickups';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (!validRole) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const { pickupId } = req.body;

    if (!pickupId) {
      return res.status(400).json({ errorMsg: 'Falta el ID de la recolección' });
    }

    await markMachineAsLost(pickupId, userId);

    res.status(200).json({ message: 'Equipo marcado como perdido exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: error.message || 'Error al marcar el equipo como perdido' });
  }
}
