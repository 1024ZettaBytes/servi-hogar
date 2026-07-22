import { validateUserPermissions, getUserId } from '../auth/authUtils';
import {
  getExternalRepairsData,
  createExternalRepairData,
  evaluateExternalRepairSLAs
} from '../../../lib/data/ExternalRepairs';

async function getExternalRepairsAPI(req, res, userId, role) {
  try {
    const pending = req.query.pending !== 'false';
    const repairs = await getExternalRepairsData(userId, pending);
    // Office (AUX/ADMIN) drives the on-read SLA engine (48h reminders, return
    // alerts and office blocking).
    let reminders = [];
    let overdueReturns = [];
    // Only drive the SLA engine on the active (pending) fetch; the finalized
    // fetch is read-only and would otherwise re-run it needlessly.
    if (pending && ['ADMIN', 'AUX'].includes(role)) {
      const sla = await evaluateExternalRepairSLAs();
      reminders = sla.reminders;
      overdueReturns = sla.overdueReturns;
    }
    res.status(200).json({ data: repairs, reminders, overdueReturns });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function createExternalRepairAPI(req, res, userId) {
  try {
    await createExternalRepairData({ ...req.body, createdBy: userId });
    res
      .status(200)
      .json({ msg: 'Recolección de reparación externa agendada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
  switch (req.method) {
    case 'GET': {
      const role = await validateUserPermissions(req, res, [
        'ADMIN',
        'AUX',
        'TEC',
        'OPE'
      ]);
      if (!role) return;
      await getExternalRepairsAPI(req, res, userId, role);
      break;
    }
    case 'POST': {
      // Office schedules the pickup.
      const ok = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
      if (!ok) return;
      await createExternalRepairAPI(req, res, userId);
      break;
    }
  }
}

export default handler;
