import { getConditioningByTechnicianData, getAllConditioningData } from '../../../lib/data/WarehouseMachines';
import { getUserId, validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
  if (validRole) {
    if (req.method === 'GET') {
      try {
        const userId = await getUserId(req);

        let machines;
        if (validRole === 'TEC') {
          // Technicians only see their own assignments
          machines = await getConditioningByTechnicianData(userId);
        } else {
          // Admin/Aux see all
          machines = await getAllConditioningData();
        }

        return res.status(200).json({ data: machines });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    }
    return res.status(405).json({ error: 'Método no permitido' });
  }
}
