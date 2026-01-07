import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";

export async function savePaymentAccount(paymentAccountData) {
  try {
    const res = await axios.post(
      ROUTES.ALL_PAYMENT_ACCOUNTS_API,
      JSON.stringify(paymentAccountData),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_PAYMENT_ACCOUNTS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar la cuenta. Por favor intente de nuevo.",
    };
  }
}

export async function deletePaymentAccount(accountId) {
  try {
    const res = await axios.delete(
      `${ROUTES.ALL_PAYMENT_ACCOUNTS_API}/${accountId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_PAYMENT_ACCOUNTS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al eliminar la cuenta. Por favor intente de nuevo.",
    };
  }
}
