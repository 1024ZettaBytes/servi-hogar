import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';
export async function saveProduct(data) {
  try {
    const res = await axios.post(ROUTES.ALL_PRODUCTS, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_PRODUCTS + '?detailed=true');
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al guardar el producto. Por favor intente de nuevo.'
    };
  }
}
export async function saveProductEntry(data) {
  try {
    const res = await axios.post(
      ROUTES.ALL_PRODUCTS_ENTRIES,
      JSON.stringify(data),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_PRODUCTS_ENTRIES);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al registrar la entrada. Por favor intente de nuevo.'
    };
  }
}
