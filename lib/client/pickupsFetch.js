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
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar la recolección. Por favor intente de nuevo.",
    };
  }
}
