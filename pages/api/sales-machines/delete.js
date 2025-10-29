import { deleteSalesMachinesData } from '../../../lib/data/SalesMachines';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  const { userId } = token;
  if (req.method === 'DELETE') {
    try {
      const result = await deleteSalesMachinesData({ 
        ...req.body, 
        lastUpdatedBy: userId 
      });
      return res.status(200).json({ 
        result, 
        msg: 'Equipo(s) de venta eliminado(s) exitosamente' 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
