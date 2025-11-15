import { validateUserPermissions } from '../auth/authUtils';
import { getUnassignedDeliveriesData, getOverdueDeliveriesData } from '../../../lib/data/Deliveries';
import { getUnassignedChangesData, getOverdueChangesData } from '../../../lib/data/Changes';
import { getUnassignedPickupsData, getOverduePickupsData } from '../../../lib/data/Pickups';
import { getOverdueRentsData } from '../../../lib/data/Rents';
import { getOverdueSalesData } from '../../../lib/data/Sales';

async function getPendingActionsAPI(req, res) {
  try {
    const [
      unassignedDeliveries,
      unassignedChanges,
      unassignedPickups,
      overdueDeliveries,
      overdueChanges,
      overduePickups,
      overdueRents,
      overdueSales
    ] = await Promise.all([
      getUnassignedDeliveriesData(),
      getUnassignedChangesData(),
      getUnassignedPickupsData(),
      getOverdueDeliveriesData(),
      getOverdueChangesData(),
      getOverduePickupsData(),
      getOverdueRentsData(),
      getOverdueSalesData()
    ]);

    // Combine unassigned actions
    const unassignedActions = [
      ...unassignedDeliveries.map(d => ({ ...d, type: 'ENTREGA' })),
      ...unassignedChanges.map(c => ({ ...c, type: 'CAMBIO' })),
      ...unassignedPickups.map(p => ({ ...p, type: 'RECOLECCION' }))
    ];

    // Combine overdue actions
    const overdueActions = [
      ...overdueDeliveries.map(d => ({ ...d, type: 'ENTREGA' })),
      ...overdueChanges.map(c => ({ ...c, type: 'CAMBIO' })),
      ...overduePickups.map(p => ({ ...p, type: 'RECOLECCION' }))
    ];

    res.status(200).json({
      data: {
        unassigned: unassignedActions,
        overdue: overdueActions,
        overdueRents: overdueRents,
        overdueSales: overdueSales
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (validRole) {
    switch (req.method) {
      case 'GET':
        await getPendingActionsAPI(req, res);
        break;
    }
  }
}

export default handler;
