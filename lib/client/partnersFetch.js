import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function getAvailableMachinesForPartnerAssignment() {
  try {
    const res = await axios.get(
      `${ROUTES.ALL_PARTNERS}?availableForAssignment=true`
    );

    return {
      error: false,
      data: res.data?.data || []
    };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al consultar los equipos disponibles para socios.'
    };
  }
}

export async function assignMachineToPartner({ userId, machineId }) {
  try {
    const res = await axios.post(
      ROUTES.PARTNER_ASSIGN_MACHINE_API,
      JSON.stringify([{ userId, machineId }]),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    await refreshData(ROUTES.ALL_PARTNERS);
    return {
      error: false,
      msg: res.data?.msg || 'Asignación realizada correctamente.'
    };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al asignar el equipo al socio. Por favor intente de nuevo.'
    };
  }
}
