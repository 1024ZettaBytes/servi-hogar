import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";

export async function saveChange(changeData) {
  try {
    const URL = ROUTES.ALL_CHANGES_API;
    const res = await axios.post(URL, JSON.stringify(changeData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.ALL_CHANGES_API);
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    return { error: false, msg: res.data.msg, change: res.data.change };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar el cambio. Por favor intente de nuevo.",
    };
  }
}

export async function completeChange(completeData) {
  try {
    const URL = ROUTES.ALL_PENDING_CHANGES_API;
    const res = await axios.post(URL, JSON.stringify(completeData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.RENT_BY_ID_API);
    refreshData(ROUTES.ALL_CHANGES_API);
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al completar el cambio. Por favor intente de nuevo.",
    };
  }
}

export async function updateChangeTime(changeData) {
  try {
    const URL = ROUTES.ALL_CHANGES_API;
    const res = await axios.put(URL, JSON.stringify(changeData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al actualizar el cambio. Por favor intente de nuevo.",
    };
  }
}

export async function cancelChange(changeId, cancellationReason) {
  try {
    const URL = ROUTES.ALL_CHANGES_API;
    const res = await axios.delete(URL, {
      data: JSON.stringify({ changeId, cancellationReason }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    refreshData(ROUTES.ALL_RENTS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al cancelar el cambio. Por favor intente de nuevo.",
    };
  }
}
