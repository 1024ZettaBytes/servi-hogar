import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';
export async function saveUser(data) {
  try {
    const res = await axios.post(ROUTES.ALL_USERS, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_USERS);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al guardar el usuario. Por favor intente de nuevo.'
    };
  }
}
export async function updateUser(data) {
  try {
    const res = await axios.put(ROUTES.ALL_USERS, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_USERS);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al actualizar el usuario. Por favor intente de nuevo.'
    };
  }
}

export async function updateTecnician(data) {
  try {
    const res = await axios.put(ROUTES.ALL_TECHNICIANS, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_USERS);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al actualizar el técnico. Por favor intente de nuevo.'
    };
  }
}
