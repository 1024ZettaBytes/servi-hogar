import axios from "axios";
import {ROUTES} from "../consts/API_URL_CONST";
import {refreshData} from "../../pages/api/useRequest"


export async function updateDeliveryTime(deliveryData){
    try{
    const URL = ROUTES.ALL_PENDING_DELIVERIES_API
    const res = await axios.put(URL,JSON.stringify(deliveryData),{headers: {
        "Content-Type": "application/json",
      }});
      refreshData(ROUTES.ALL_PENDING_DELIVERIES_API);
      return {error:false, msg: res.data.msg};
    } catch(err){
        return {error:true, msg:err?.response?.data?.errorMsg ||"Error al actualizar la entrega. Por favor intente de nuevo."};
    }
}
