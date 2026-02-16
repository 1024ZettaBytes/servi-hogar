import { getCollectedMachinesData } from '../../../lib/data/Pickups';
import { validateUserPermissions, getUserId } from '../../api/auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'TEC']);
  if (!validRole) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const collectedMachines = await getCollectedMachinesData(userId, validRole);
    res.status(200).json({ data: collectedMachines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: 'Error al consultar equipos recolectados' });
  }
}
