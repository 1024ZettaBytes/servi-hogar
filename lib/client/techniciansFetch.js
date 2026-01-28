import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "pages/api/useRequest";

export async function updateTechnicianBonus(data, start, end) {
  try {
    const URL = ROUTES.TECHNICIAN_BONUSES;
    const res = await axios.put(URL, JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.REPORT_API + `?filter=technicians&period=null&start=${start}&end=${end}`);
    return { error: false, msg: res.data.msg, data: res.data.data };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al actualizar el bono. Por favor intente de nuevo.",
    };
  }
}
