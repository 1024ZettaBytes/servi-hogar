import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function updateVueltaPrice(vueltaPrice) {
  try {
    const res = await axios.put(
      ROUTES.ALL_PRICES_API,
      { vueltaPrice },
      { headers: { 'Content-Type': 'application/json' } }
    );
    await refreshData(ROUTES.ALL_PRICES_API);
    return { error: false, msg: res.data.msg, data: res.data.data };
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || 'Error al actualizar el precio por vuelta'
    };
  }
}
