import { validateUserPermissions, getUserId } from '../../../lib/auth';
import { connectToDatabase, isConnected } from '../../../lib/db';
import { sellRentMachineData } from '../../../lib/data/Rents';

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST': {
      const validRole = await validateUserPermissions(req, res, ['ADMIN']);
      if (!validRole) return;

      const userId = await getUserId(req);
      if (!isConnected()) await connectToDatabase();

      const { rentId, cashPrice } = req.body;

      if (!rentId) {
        return res.status(400).json({ errorMsg: 'Se requiere el ID de la renta' });
      }
      if (!cashPrice || Number(cashPrice) <= 0) {
        return res.status(400).json({ errorMsg: 'El precio de venta debe ser mayor a 0' });
      }

      try {
        const result = await sellRentMachineData({
          rentId,
          cashPrice: Number(cashPrice),
          createdBy: userId
        });
        return res.status(200).json({ data: result, msg: 'Máquina vendida exitosamente' });
      } catch (e) {
        return res.status(400).json({ errorMsg: e.message });
      }
    }
    default:
      return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
