import { saveSalesMachineData } from '../../../lib/data/SalesMachines';
import { getUserId } from '../auth/authUtils';

export default async function handler(req, res) {
    const userId = await getUserId(req);
  if (req.method === 'POST') {
    try {
      const result = await saveSalesMachineData({ 
        ...req.body, 
        lastUpdatedBy: userId 
      });
      return res.status(200).json({ 
        result, 
        msg: 'Equipo de venta guardado exitosamente' 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
