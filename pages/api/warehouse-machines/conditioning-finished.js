import { getFinishedConditioningData } from '../../../lib/data/WarehouseMachines';
import { getUserId, validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, [
    'ADMIN',
    'AUX',
    'TEC'
  ]);
  if (validRole) {
    if (req.method === 'GET') {
      try {
        const userId = await getUserId(req);

        // Los técnicos solo ven sus propios acondicionamientos
        const records = await getFinishedConditioningData(
          validRole === 'TEC' ? userId : null
        );

        return res.status(200).json({ data: records });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    }
    return res.status(405).json({ error: 'Método no permitido' });
  }
}
