import { deleteWarehouseMachineData } from '../../../lib/data/WarehouseMachines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (validRole) {
    const userId = await getUserId(req);
    if (req.method === 'DELETE') {
      try {
        const result = await deleteWarehouseMachineData({
          machineId: req.body.machineId,
          lastUpdatedBy: userId
        });
        return res.status(200).json({
          result,
          msg: 'Máquina de almacén eliminada exitosamente'
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    }
  }
}
