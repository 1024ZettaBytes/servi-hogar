import axios from "axios";
import {ROUTES} from "../consts/API_URL_CONST";
import {refreshData} from "../../pages/api/useRequest"
export async function saveCustomer(customerData){
    try{
    const res = await axios.post(ROUTES.ALL_CUSTOMERS_API,JSON.stringify(customerData),{headers: {
        "Content-Type": "application/json",
      }});
      refreshData(ROUTES.ALL_CUSTOMERS_API);
      return {error:false, msg: res.data.msg};
    } catch(err){
        return {error:true, msg:err?.response?.data?.errorMsg ||"Error al guardar el cliente. Por favor intente de nuevo."};
    }
}

export async function updateCustomer(customerData){
    try{
    const URL = ROUTES.CUSTOMER_BY_ID_API.replace(":id", customerData._id);
    const res = await axios.put(URL,JSON.stringify(customerData),{headers: {
        "Content-Type": "application/json",
      }});
      refreshData(ROUTES.ALL_CUSTOMERS_API);
      refreshData(URL);
      return {error:false, msg: res.data.msg};
    } catch(err){
        return {error:true, msg:err?.response?.data?.errorMsg ||"Error al actualizar el cliente. Por favor intente de nuevo."};
    }
}

export async function deleteCustomers(customersArray){

    try{
    const res = await axios.delete(ROUTES.ALL_CUSTOMERS_API,{data:JSON.stringify(customersArray),headers: {
        "Content-Type": "application/json",
      }});
      await refreshData(ROUTES.ALL_CUSTOMERS_API);
      return {error:false, msg: res.data.msg};
    } catch(err){
        return {error:true, msg:err?.response?.data?.errorMsg ||"Error al eliminar cliente. Por favor intente de nuevo."};
    }
}