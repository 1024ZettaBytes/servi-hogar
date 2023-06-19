import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";

export async function asignOperator(data) {
  try {
    const URL = ROUTES.ALL_OPERATORS;
    const res = await axios.post(URL, JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API);
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    refreshData(ROUTES.ALL_PENDING_PICKUPS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al asignar el operador. Por favor intente de nuevo.",
    };
  }
}
