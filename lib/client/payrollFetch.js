import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';
import { format } from 'date-fns';

export async function savePayrollConfig(data, swrKey) {
  try {
    const res = await axios.post(ROUTES.PAYROLL_CONFIG, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // Use the exact SWR key to ensure cache invalidation
    if (swrKey) {
      refreshData(swrKey);
    }
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al guardar la configuración. Por favor intente de nuevo.'
    };
  }
}

export async function saveWeeklyPayroll(data, swrKey) {
  try {
    const res = await axios.post(ROUTES.PAYROLL_WEEKLY, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // Use the exact SWR key to ensure cache invalidation
    if (swrKey) {
      refreshData(swrKey);
    }
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al guardar la nómina. Por favor intente de nuevo.'
    };
  }
}
