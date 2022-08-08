import useSWR, { mutate } from "swr";
import { ROUTES } from "../../lib/consts/API_URL_CONST";
export const refreshData = async (apiUrl) => {
  await mutate(apiUrl);
};
async function errorHandler(res) {
  if (!res.ok) {
    const errorBody = await res?.json();
    console.log("errorBody:", errorBody);
    const error = new Error(
      errorBody?.errorMsg
    );
    throw error;
  }
}
export const getFetcher = async (url) => {
  const res = await fetch(url).catch(err => {
    return {
      json: () => {
        return {
          ok: false, errorMsg: "Hubo un problema de conexión. Si persiste contacte al administrador."
        }
      }
    };
  });
  await errorHandler(res);
  return res.json();
};
// Customers
export const useGetAllCustomers = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CUSTOMERS_API, fetcher);
  return { customerList: data?.data, customerError: error };
};

export const useGetCustomerLevels = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CUSTOMERS_LEVELS_API, fetcher);
  return { customerLevelList: data?.data, customerLevelError: error };
};
//
// Cities
export const useGetCities = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CITIES, fetcher);
  return { citiesList: data?.data, citiesError: error };
}
//
