import { validateUserPermissions, getUserId } from '../auth/authUtils';
import {
  techConfirmToolAssignment,
  getTechToolStatus,
  checkAndRunPeriodicReset
} from '../../../lib/data/TechnicianTools';

async function getPendingConfirmationAPI(req, res) {
  try {
    await checkAndRunPeriodicReset();
    const technicianId = await getUserId(req);
    const status = await getTechToolStatus(technicianId);
    res.status(200).json({ data: status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function confirmToolsAPI(req, res) {
  try {
    const technicianId = await getUserId(req);
    const { assignmentId } = req.body;
    await techConfirmToolAssignment({ assignmentId, technicianId });
    res.status(200).json({ msg: '¡Herramientas confirmadas con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['TEC']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getPendingConfirmationAPI(req, res);
        break;
      case 'POST':
        await confirmToolsAPI(req, res);
        break;
    }
}

export default handler;
