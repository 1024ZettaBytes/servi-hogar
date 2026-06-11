import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

// All pending-vuelta SWR keys that may change after a reassignment.
const PENDING_VUELTA_KEYS = [
  ROUTES.ALL_PENDING_DELIVERIES_API,
  ROUTES.ALL_PENDING_PICKUPS_API,
  ROUTES.ALL_PENDING_PICKUPS_API + '?detailed=true',
  ROUTES.ALL_PENDING_CHANGES_API,
  ROUTES.ALL_PENDING_SALE_PICKUPS_API + '?detailed=true',
  ROUTES.ALL_PENDING_SALE_PICKUPS_API + '?detailed=false',
  ROUTES.ALL_PENDING_SALE_CHANGES_API,
  ROUTES.PENDING_SALE_DELIVERIES_API,
  ROUTES.ALL_PENDING_COLLECTIONS_API,
  ROUTES.ALL_PENDING_EXTRA_TRIPS_API,
  ROUTES.ALL_PENDING_SALES_API
];

export async function reassignVuelta({ taskType, taskId, operatorId }) {
  try {
    const res = await axios.post(
      ROUTES.REASSIGN_VUELTA_API,
      JSON.stringify({ taskType, taskId, operatorId }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    await Promise.all(PENDING_VUELTA_KEYS.map((key) => refreshData(key)));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al reasignar la vuelta. Por favor intente de nuevo.'
    };
  }
}
