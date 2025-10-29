import { getSalesMachinesData, getAllSalesMachinesData } from '../../../lib/data/SalesMachines';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { all } = req.query;
      const salesMachinesList = all === 'true' 
        ? await getAllSalesMachinesData() 
        : await getSalesMachinesData();
      return res.status(200).json({ salesMachinesList });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
