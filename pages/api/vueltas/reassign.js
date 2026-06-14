import { reassignVueltaData } from '../../../lib/data/Vueltas';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function reassignAPI(req, res, userId) {
  try {
    const { taskType, taskId, operatorId } = req.body;
    if (!taskType || !taskId || !operatorId) {
      return res.status(400).json({
        errorMsg: 'Faltan datos para reasignar la vuelta (taskType, taskId, operatorId)'
      });
    }
    await reassignVueltaData({
      taskType,
      taskId,
      operatorId,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Vuelta reasignada con éxito' });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === 'Internal'
          ? e.message
          : 'Hubo un problema al reasignar la vuelta. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (!validRole) return;
  const userId = await getUserId(req);
  switch (req.method) {
    case 'POST':
      await reassignAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
