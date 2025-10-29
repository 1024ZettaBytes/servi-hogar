import { updateSalesMachineData } from '../../../lib/data/SalesMachines';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  const { userId } = token;
  if (req.method === 'PUT') {
    try {
      const result = await updateSalesMachineData({ 
        ...req.body, 
        lastUpdatedBy: userId 
      });
      return res.status(200).json({ 
        result, 
        msg: 'Equipo de venta actualizado exitosamente' 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
