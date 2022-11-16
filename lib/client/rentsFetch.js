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
    refreshData(ROUTES.ALL_CUSTOMERS_FOR_RENT_API);
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API)
    return { error: false, msg: res.data.msg, rent:res.data.rent, delivery: res.data.delivery };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar la renta. Por favor intente de nuevo.",
    };
  }
}

export async function extendRent(extendData) {
  try {
    const res = await axios.post(
      ROUTES.ALL_EXTEND_RENTS,
      JSON.stringify(extendData),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_CUSTOMERS_FOR_RENT_API);
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API)
    return { error: false, msg: res.data.msg, rent:res.data.rent };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al extender el tiempo de renta. Por favor intente de nuevo.",
    };
  }
}
export async function changePayday(rentId, day) {
  try {
    const res = await axios.put(
      ROUTES.RENT_BY_ID_API.replace(":id", rentId),
      JSON.stringify({day}),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_CUSTOMERS_FOR_RENT_API);
    refreshData(ROUTES.ALL_RENTS_API);
    refreshData(ROUTES.RENT_BY_ID_API.replace(":id", rentId));
    return { error: false, msg: res.data.msg, rent:res.data.rent };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al extender el tiempo de renta. Por favor intente de nuevo.",
    };
  }
}