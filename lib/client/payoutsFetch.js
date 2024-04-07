import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';
export async function updatePayout(attachment, payoutData) {
  try {
    const json = JSON.stringify(payoutData);
    const data = new FormData();
    data.append('body', json);
    data.append('file', attachment);
    const res = await axios.put(ROUTES.ALL_PAYOUTS, data, {
      headers: {
        Accept: 'application/json ,text/plain, */*',
        'Content-Type': 'multipart/form-data'
      }
    });
    refreshData(ROUTES.ALL_PAYOUTS);
    refreshData(ROUTES.PARTNER_MACHINES);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al guardar el pago. Por favor intente de nuevo.'
    };
  }
}
