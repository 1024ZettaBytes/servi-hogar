import { dismantleRentalMachineData } from '../../../lib/data/Machines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (validRole) {
    switch (req.method) {
      case 'POST':
        try {
          const userId = await getUserId(req);
          const { machineId } = req.body;
          const result = await dismantleRentalMachineData({
            machineId,
            lastUpdatedBy: userId
          });
          res.status(200).json({ msg: '¡Equipo desmantelado!', data: result });
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
