import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";

export async function updateDeliveryTime(deliveryData) {
  try {
    const URL = ROUTES.ALL_DELIVERIES_API;
    const res = await axios.put(URL, JSON.stringify(deliveryData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al actualizar la entrega. Por favor intente de nuevo.",
    };
  }
}

export async function cancelDelivery(deliveryId, cancellationReason) {
  try {
    const URL = ROUTES.ALL_DELIVERIES_API;
    const res = await axios.delete(
      URL,
      { data: JSON.stringify({ deliveryId, cancellationReason }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API);
    refreshData(ROUTES.ALL_RENTS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al cancelar la entrega. Por favor intente de nuevo.",
    };
  }
}
export async function completeDelivery(attachment, completeData){
    try{
        const json = JSON.stringify(completeData);
        const data = new FormData();
        data.append("body", json);
        Object.keys(attachment).forEach(key=>{
          data.append(key, attachment[key].file);
        })
        
    const res = await axios.post(ROUTES.ALL_PENDING_DELIVERIES_API, data, {headers: { 
        Accept: "application/json ,text/plain, */*",
        "Content-Type": "multipart/form-data",
      },});
      refreshData(ROUTES.ALL_CUSTOMERS_API);
      return {error:false, msg: res.data.msg};
    } catch(err){
        console.log(err);
        return {error:true, msg:err?.response?.data?.errorMsg ||"Error al guardar el cliente. Por favor intente de nuevo."};
    }
}