import { validateUserPermissions, getUserId } from '../auth/authUtils';
import {
  getExternalRepairById,
  submitExternalRepairBudget,
  authorizeExternalRepairBudget,
  rejectExternalRepairBudget,
  scheduleExternalRepairDelivery,
  postponeExternalRepairDelivery,
  receiveExternalRepairInWarehouseData,
  cancelExternalRepairData
} from '../../../lib/data/ExternalRepairs';

async function getExternalRepairByIdAPI(req, res) {
  try {
    const repair = await getExternalRepairById(req.query.repairId);
    res.status(200).json({ data: repair });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function submitBudgetAPI(req, res, userId) {
  try {
    await submitExternalRepairBudget({
      ...req.body,
      repairId: req.query.repairId,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Presupuesto enviado a oficina.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function authorizeAPI(req, res, userId) {
  try {
    await authorizeExternalRepairBudget({
      repairId: req.query.repairId,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Presupuesto autorizado.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function rejectAPI(req, res, userId) {
  try {
    await rejectExternalRepairBudget({
      repairId: req.query.repairId,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Presupuesto no autorizado.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function scheduleDeliveryAPI(req, res, userId) {
  try {
    await scheduleExternalRepairDelivery({
      repairId: req.query.repairId,
      operatorId: req.body.operatorId,
      scheduledDate: req.body.scheduledDate,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Entrega programada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function postponeDeliveryAPI(req, res, userId) {
  try {
    await postponeExternalRepairDelivery({
      repairId: req.query.repairId,
      scheduledDate: req.body.scheduledDate,
      note: req.body.note,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Entrega pospuesta.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function receiveWarehouseAPI(req, res, userId) {
  try {
    await receiveExternalRepairInWarehouseData({
      repairId: req.query.repairId,
      warehouseId: req.body.warehouseId,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Equipo recibido en bodega.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelAPI(req, res, userId) {
  try {
    await cancelExternalRepairData({
      repairId: req.query.repairId,
      cancellationReason: req.body.cancellationReason,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Recolección cancelada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
  switch (req.method) {
    case 'GET': {
      const ok = await validateUserPermissions(req, res, [
        'ADMIN',
        'AUX',
        'TEC',
        'OPE'
      ]);
      if (!ok) return;
      await getExternalRepairByIdAPI(req, res);
      break;
    }
    case 'PUT': {
      const { operation } = req.body || {};
      const officeOps = [
        'AUTHORIZE',
        'REJECT',
        'SCHEDULE_DELIVERY',
        'POSTPONE_DELIVERY',
        'CANCEL'
      ];
      if (officeOps.includes(operation)) {
        // Office actions.
        const ok = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
        if (!ok) return;
        if (operation === 'AUTHORIZE') await authorizeAPI(req, res, userId);
        else if (operation === 'REJECT') await rejectAPI(req, res, userId);
        else if (operation === 'SCHEDULE_DELIVERY')
          await scheduleDeliveryAPI(req, res, userId);
        else if (operation === 'POSTPONE_DELIVERY')
          await postponeDeliveryAPI(req, res, userId);
        else await cancelAPI(req, res, userId);
      } else if (operation === 'RECEIVE_WAREHOUSE') {
        // Warehouse staff drops the collected machine into a warehouse.
        const ok = await validateUserPermissions(req, res, [
          'ADMIN',
          'AUX',
          'TEC'
        ]);
        if (!ok) return;
        await receiveWarehouseAPI(req, res, userId);
      } else {
        // Technician submits the budget.
        const ok = await validateUserPermissions(req, res, ['ADMIN', 'TEC']);
        if (!ok) return;
        await submitBudgetAPI(req, res, userId);
      }
      break;
    }
  }
}

export default handler;
