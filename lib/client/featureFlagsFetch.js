import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function updateFeatureFlag(key, enabled) {
  try {
    const res = await axios.put(
      ROUTES.FEATURE_FLAGS_API,
      { key, enabled },
      { headers: { 'Content-Type': 'application/json' } }
    );
    await refreshData(ROUTES.FEATURE_FLAGS_API);
    return { error: false, msg: res.data.msg, data: res.data.data };
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || 'Error al actualizar la configuración'
    };
  }
}
