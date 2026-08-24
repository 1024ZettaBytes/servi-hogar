import { getScheduledSlotsForDate } from '../../../lib/data/Tasks';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  
  if (!validRole) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, msg: 'Method not allowed' });
  }

  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        error: true, 
        msg: 'date parameter is required' 
      });
    }

    // El operador solo ve su propia agenda; oficina puede pedir la de un operador
    // en concreto o (sin operatorId) todas para la vista por columnas.
    const userId = await getUserId(req);
    const operatorId =
      validRole === 'OPE' ? userId : req.query.operatorId || null;

    const result = await getScheduledSlotsForDate(date, { operatorId });

    if (result.error) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in scheduled-slots API:', error);
    return res.status(500).json({ 
      error: true, 
      msg: error.message || 'Internal server error',
      data: []
    });
  }
}
