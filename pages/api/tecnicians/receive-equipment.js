import { receiveCollectedEquipmentData } from '../../../lib/data/Machines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'TEC', 'AUX']);
  if (!validRole) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const { machineId, arrived = true, warehouseId } = req.body;

    if (!machineId) {
      return res.status(400).json({ errorMsg: 'ID de equipo requerido' });
    }

    await receiveCollectedEquipmentData({
      machineId,
      arrived,
      warehouseId,
      lastUpdatedBy: userId
    });

    res.status(200).json({ message: 'Cambios guardados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: error.message || 'Error al recibir el equipo' });
  }
}
