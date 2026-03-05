import { validateUserPermissions } from '../auth/authUtils';
import { getAuxPendingToolActions, checkAndRunPeriodicReset } from '../../../lib/data/TechnicianTools';

async function getAuxPendingAPI(req, res) {
  try {
    await checkAndRunPeriodicReset();
    const result = await getAuxPendingToolActions();
    res.status(200).json({ data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['AUX']);
  if (validRole) {
    switch (req.method) {
      case 'GET':
        await getAuxPendingAPI(req, res);
        break;
    }
  }
}

export default handler;
