import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";
export async function saveRent(rentData) {
  try {
    const res = await axios.post(
      ROUTES.ALL_RENTS_API,
      JSON.stringify(rentData),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_RENTS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar la renta. Por favor intente de nuevo.",
    };
  }
}