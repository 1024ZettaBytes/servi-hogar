import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function saveSaleChange(changeData) {
  try {
    const URL = ROUTES.ALL_SALE_CHANGES_API;
    const res = await axios.post(URL, JSON.stringify(changeData), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_SALES_API);
    refreshData(ROUTES.ALL_PENDING_SALE_CHANGES_API);
    return { error: false, msg: res.data.msg, change: res.data.change };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al agendar el cambio por garantía. Por favor intente de nuevo.'
    };
  }
}

export async function completeSaleChange(attachment, completeData) {
  try {
    const URL = ROUTES.ALL_PENDING_SALE_CHANGES_API;
    const json = JSON.stringify(completeData);
    const data = new FormData();
    data.append('body', json);
    if (attachment) {
      Object.keys(attachment).forEach((key) => {
        data.append(key, attachment[key].file);
      });
    }
    const res = await axios.post(URL, data, {
      headers: {
        Accept: 'application/json ,text/plain, */*',
        'Content-Type': 'multipart/form-data'
      }
    });
    refreshData(ROUTES.ALL_SALES_API);
    refreshData(ROUTES.ALL_PENDING_SALE_CHANGES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al completar el cambio por garantía. Por favor intente de nuevo.'
    };
  }
}

export async function cancelSaleChange(changeId, cancellationReason) {
  try {
    const URL = ROUTES.ALL_SALE_CHANGES_API;
    const res = await axios.delete(URL, {
      data: JSON.stringify({ changeId, cancellationReason }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_PENDING_SALE_CHANGES_API);
    refreshData(ROUTES.ALL_SALES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al cancelar el cambio por garantía. Por favor intente de nuevo.'
    };
  }
}
