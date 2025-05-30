import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";


export async function completeMantainance(mantainanceId) {
  try {
    const URL = ROUTES.ALL_PENDING_MANTAINANCES;
    const res = await axios.put(URL,
      JSON.stringify({ mantainanceId }),
      {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_PENDING_MANTAINANCES);
    refreshData(ROUTES.ALL_MANTAINANCES);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al completar el mantenimiento. Por favor intente de nuevo.",
    };
  }
}
