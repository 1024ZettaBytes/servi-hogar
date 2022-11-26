import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";

export async function savePickup(pickupData) {
  try {
    const URL = ROUTES.ALL_PICKUP_API;
    const res = await axios.post(URL, JSON.stringify(pickupData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.RENT_BY_ID_API);
    refreshData(ROUTES.ALL_PICKUP_API);
    refreshData(ROUTES.ALL_PENDING_PICKUPS_API);
    return { error: false, msg: res.data.msg, pickup: res.data.pickup};
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar la recolección. Por favor intente de nuevo.",
    };
  }
}

export async function completePickup(attachment, completeData) {
  try {
    const URL = ROUTES.ALL_PENDING_PICKUPS_API;
    const json = JSON.stringify(completeData);
    const data = new FormData();
    data.append("body", json);
    if (attachment) {
      Object.keys(attachment).forEach((key) => {
        data.append(key, attachment[key].file);
      });
    }
    const res = await axios.post(URL, data, {
      headers: {
        Accept: "application/json ,text/plain, */*",
        "Content-Type": "multipart/form-data",
      },
    });
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.RENT_BY_ID_API);
    refreshData(ROUTES.ALL_PICKUP_API);
    refreshData(ROUTES.ALL_PENDING_PICKUPS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al completar la recolección. Por favor intente de nuevo.",
    };
  }
}

export async function updatePickupTime(pickupData) {
  try {
    const URL = ROUTES.ALL_PICKUP_API;
    const res = await axios.put(URL, JSON.stringify(pickupData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_PENDING_PICKUPS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al actualizar la recolección. Por favor intente de nuevo.",
    };
  }
}

export async function cancelPickup(pickupId, cancellationReason) {
  try {
    const URL = ROUTES.ALL_PICKUP_API;
    const res = await axios.delete(
      URL,
      { data: JSON.stringify({ pickupId, cancellationReason }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_PENDING_PICKUPS_API);
    refreshData(ROUTES.ALL_RENTS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al cancelar la recolección. Por favor intente de nuevo.",
    };
  }
}
