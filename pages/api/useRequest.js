import useSWR, { mutate } from "swr";
import { ROUTES } from "../../lib/consts/API_URL_CONST";
export const refreshData = async (apiUrl) => {
  await mutate(apiUrl);
};
async function errorHandler(res) {
  if (!res.ok) {
    const errorBody = await res?.json();
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

export const useGetCustomerById = (fetcher, id) => {
  const { data, error } = useSWR(id ?ROUTES.CUSTOMER_BY_ID_API.replace(":id", id): null, fetcher);
  return { customer: data?.data, customerByIdError: error };
}
//
// Cities
export const useGetCities = (fetcher) => {
  const { data, error } = useSWR( ROUTES.ALL_CITIES, fetcher);
  return { citiesList: data?.data, citiesError: error };
}
//
// Machines
export const useGetAllMachines = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_MACHINES_API, fetcher);
  return { machinesData: data?.data, machinesError: error };
};

export const useGetMachinesStatus = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_MACHINES_STATUS_API, fetcher);
  return { machinesStatusList: data?.data, machinesStatusError: error };
};

export const useGetAllMachinesLocations = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_MACHINES_LOCATIONS_API, fetcher);
  return { machinesLocationData: data?.data, machinesLocationError: error };

};
// Warehouses
export const useGetAllWarehousesOverview = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_WAREHOUSES_OVERVIEW_API, fetcher);
  return { warehousesList: data?.data, warehousesError: error };
};
// Vehicles
export const useGetAllVehicles = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_VEHICLES_API, fetcher);
  return { vehiclesList: data?.data, vehiclesError: error };
};

