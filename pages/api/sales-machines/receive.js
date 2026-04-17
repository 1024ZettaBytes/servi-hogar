import { receiveSalesMachineData } from '../../../lib/data/SalesMachines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'TEC', 'AUX']);
  if (!validRole) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const { machineId, isRepair, arrived = true } = req.body;

    if (!machineId) {
      return res.status(400).json({ errorMsg: 'ID de equipo requerido' });
    }

    await receiveSalesMachineData({
      machineId,
      isRepair,
      arrived,
      lastUpdatedBy: userId
    });

    res.status(200).json({ message: 'Equipo recibido correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: error.message || 'Error al recibir el equipo de venta' });
  }
}
