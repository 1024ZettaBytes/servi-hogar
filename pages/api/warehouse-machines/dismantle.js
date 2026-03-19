import { dismantleWarehouseMachineData } from '../../../lib/data/WarehouseMachines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (validRole) {
    switch (req.method) {
      case 'POST':
        try {
          const userId = await getUserId(req);
          const { warehouseMachineId } = req.body;
          const result = await dismantleWarehouseMachineData({
            warehouseMachineId,
            lastUpdatedBy: userId
          });
          res.status(200).json({ msg: '¡Máquina desmantelada!', data: result });
        } catch (e) {
          console.error(e);
          res.status(500).json({ errorMsg: e.message });
        }
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
  }
}

export default handler;
