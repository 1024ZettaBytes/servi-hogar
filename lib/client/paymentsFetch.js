import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";
export async function savePayment(attachment, paymentData) {
  try {
    const json = JSON.stringify(paymentData);
    const data = new FormData();
    data.append("body", json);
    data.append("file", attachment);
    const res = await axios.post(ROUTES.ALL_PAYMENTS_API, data, {
      headers: {
        Accept: "application/json ,text/plain, */*",
        "Content-Type": "multipart/form-data",
      },
    });
    refreshData(ROUTES.ALL_PAYMENTS_API);
    refreshData(ROUTES.CUSTOMER_BY_ID_API);
    refreshData(ROUTES.RENT_BY_ID_API);
    return { 
      error: false, 
      msg: res.data.msg, 
      paymentNumber: res.data.paymentNumber,
      receipt: res.data.receipt
    };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar el pago. Por favor intente de nuevo.",
    };
  }
}
