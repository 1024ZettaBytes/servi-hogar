import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function assignToolsToTechnician(formData) {
  try {
    const res = await axios.post(ROUTES.ALL_TECHNICIAN_TOOLS, formData, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'multipart/form-data'
      }
    });
    refreshData(ROUTES.ALL_TECHNICIAN_TOOLS);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al asignar las herramientas. Por favor intente de nuevo.'
    };
  }
}

export async function auxVerifyToolAssignment(formData) {
  try {
    const res = await axios.put(ROUTES.ALL_TECHNICIAN_TOOLS, formData, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'multipart/form-data'
      }
    });
    refreshData(ROUTES.ALL_TECHNICIAN_TOOLS);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al verificar la asignación. Por favor intente de nuevo.'
    };
  }
}

export async function techConfirmTools(assignmentId) {
  try {
    const res = await axios.post(
      ROUTES.TECHNICIAN_TOOLS_CONFIRM,
      JSON.stringify({ assignmentId }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.TECHNICIAN_TOOLS_CONFIRM);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al confirmar las herramientas. Por favor intente de nuevo.'
    };
  }
}
