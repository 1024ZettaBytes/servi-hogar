import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function completeMantainance({ mantainanceId, description }) {
  try {
    const URL = ROUTES.ALL_PENDING_MANTAINANCES;
    const res = await axios.put(
      URL,
      JSON.stringify({ mantainanceId, description }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_PENDING_MANTAINANCES);
    refreshData(ROUTES.ALL_MANTAINANCES);
    refreshData(ROUTES.MANTAINANCE_BY_ID_API.replace(':id', mantainanceId));

    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al completar el mantenimiento. Por favor intente de nuevo.'
    };
  }
}

export async function cancelMantainance({ mantainanceId, cancellationReason }) {
  try {
    const URL = ROUTES.MANTAINANCE_BY_ID_API.replace(':id', mantainanceId);
    const res = await axios.put(
      URL,
      JSON.stringify({ mantainanceId, cancellationReason }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_PENDING_MANTAINANCES);
    refreshData(ROUTES.ALL_MANTAINANCES);
    refreshData(ROUTES.MANTAINANCE_BY_ID_API.replace(':id', mantainanceId));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al completar el mantenimiento. Por favor intente de nuevo.'
    };
  }
}

export async function saveUsedProduct({ mantainanceId, productId, qty }) {
  try {
    const URL = ROUTES.USED_PRODUCT_API;
    const res = await axios.post(
      URL,
      JSON.stringify({ mantainanceId, productId, qty }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_PENDING_MANTAINANCES);
    refreshData(ROUTES.ALL_MANTAINANCES);
    refreshData(ROUTES.MANTAINANCE_BY_ID_API.replace(':id', mantainanceId));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al agregar la refacción. Por favor intente de nuevo.'
    };
  }
}
