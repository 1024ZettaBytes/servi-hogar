import { getWarehouseMachinesData, getWarehouseMachinesByStatusData, getWarehouseMachinesByStatusLightData, getWarehouseSummaryData } from '../../../lib/data/WarehouseMachines';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { status, summary, fields } = req.query;
      
      if (summary === 'true') {
        const summaryData = await getWarehouseSummaryData();
        return res.status(200).json({ data: summaryData });
      }
      
      if (status && fields === 'minimal') {
        const machines = await getWarehouseMachinesByStatusLightData(status);
        return res.status(200).json({ data: machines });
      }

      const warehouseMachinesList = status
        ? await getWarehouseMachinesByStatusData(status)
        : await getWarehouseMachinesData();
      return res.status(200).json({ data: warehouseMachinesList });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
