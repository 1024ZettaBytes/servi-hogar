import { getConditioningRecordsData } from '../../../lib/data/WarehouseMachines';
import { getUserRole } from '../auth/authUtils';

export default async function handler(req, res) {
  const role = await getUserRole(req, res);
  if (!role) return;
  if (!['ADMIN', 'AUX'].includes(role)) {
    return res.status(403).json({ error: 'No tiene permisos para esta acción' });
  }
  if (req.method === 'GET') {
    try {
      const { startDate, endDate, technicianId } = req.query;
      const records = await getConditioningRecordsData({
        startDate,
        endDate,
        technicianId
      });
      return res.status(200).json({ data: records });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
