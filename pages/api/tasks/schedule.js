import { updateTaskScheduledTime } from '../../../lib/data/Tasks';
import { validateUserPermissions } from '../auth/authUtils';

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  
  if (!validRole) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, msg: 'Method not allowed' });
  }

  try {
    const { taskId, taskType, scheduledTime } = req.body;

    if (!taskId || !taskType) {
      return res.status(400).json({ 
        error: true, 
        msg: 'taskId and taskType are required' 
      });
    }

    const validTaskTypes = ['ENTREGA', 'RECOLECCION', 'CAMBIO', 'RECOLECCION_VENTA', 'COBRANZA', 'VUELTA_EXTRA'];
    if (!validTaskTypes.includes(taskType)) {
      return res.status(400).json({ 
        error: true, 
        msg: 'Invalid task type' 
      });
    }

    const result = await updateTaskScheduledTime(taskId, taskType, scheduledTime);

    if (result.error) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in schedule API:', error);
    return res.status(500).json({ 
      error: true, 
      msg: error.message || 'Internal server error' 
    });
  }
}
