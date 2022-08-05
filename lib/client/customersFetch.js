import axios from "axios";
import {ROUTES} from "../../pages/API_URL_CONST";
import {refreshData} from "../../pages/api/useRequest"
export async function saveCustomer(customerData){
    try{
    const res = await axios.post(ROUTES.ALL_CUSTOMERS_API,JSON.stringify(customerData),{headers: {
        "Content-Type": "application/json",
      }});
      await refreshData(ROUTES.ALL_CUSTOMERS_API);
      return {error:false, mesg: res.data.msg};
    } catch(err){
        return {error:true, msg:err?.response?.data?.errorMsg ||"Error al guardar el cliente. Por favor intente de nuevo."};
    }
}