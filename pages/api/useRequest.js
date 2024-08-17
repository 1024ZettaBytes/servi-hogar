import useSWR, { mutate } from 'swr';
import { ROUTES } from '../../lib/consts/API_URL_CONST';
import { formatTZDate } from 'lib/client/utils';
const noRefreshOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: true
};
function getPaginatedUrl(url, limit, page, searchTerm) {
  return (
    `${url}?limit=${limit}&page=${page}` +
    (searchTerm && searchTerm.trim() !== '' ? `&searchTerm=${searchTerm}` : '')
  );
}
export const refreshData = async (apiUrl) => {
  await mutate(apiUrl);
};
async function errorHandler(res) {
  if (!res.ok) {
    const errorBody = await res?.json();
    const error = new Error(errorBody?.errorMsg);
    throw error;
  }
}
export const getFetcher = async (url) => {
  const res = await fetch(url).catch((err) => {
    return {
      json: () => {
        return {
          ok: false,
          errorMsg:
            'Hubo un problema de conexión. Si persiste contacte al administrador.'
        };
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

export const useGetAllCustomersForRent = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CUSTOMERS_FOR_RENT_API, fetcher);
  return { customersForRentList: data?.data, customersForRentError: error };
};
export const useGetCustomerLevels = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CUSTOMERS_LEVELS_API, fetcher);
  return { customerLevelList: data?.data, customerLevelError: error };
};

export const useGetCustomerById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.CUSTOMER_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { customer: data?.data, customerByIdError: error };
};
//
// Cities
export const useGetCities = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CITIES, fetcher);
  return { citiesList: data?.data, citiesError: error };
};
//
// Machines
export const useGetAllMachines = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_MACHINES_API, fetcher);
  return { machinesData: data?.data, machinesError: error };
};

export const useGetMachinesForRent = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_MACHINES_FOR_RENT_API, fetcher);
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

export const useGetMachineById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.MACHINE_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { machine: data?.data, machineByIdError: error };
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
// Rents
export const useGetRents = (filter, fetcher) => {
  const url = `${ROUTES.ALL_RENTS_API}?filter=${filter}`;
  const { data, error } = useSWR(url, fetcher);
  return filter == 'current'
    ? { rentsData: data?.data, rentsError: error }
    : { pastRentsData: data?.data, pastRentsError: error };
};
export const useGetRentById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.RENT_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { rent: data?.data, rentByIdError: error };
};
// Prices
export const useGetPrices = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PRICES_API, fetcher);
  return { prices: data?.data, pricesError: error };
};
// Deliveries
export const useGetPendingDeliveries = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PENDING_DELIVERIES_API, fetcher);
  return { pendingDeliveriesList: data?.data, pendingDeliveriesError: error };
};
export const useGetDeliveries = (fetcher, limit, page, searchTerm=null) => {
  const { data, error } = useSWR(
    getPaginatedUrl(ROUTES.ALL_DELIVERIES_API, limit, page, searchTerm),
    fetcher
  );
  return { deliveriesList: data?.data, deliveriesError: error };
};
export const useGetDeliveryById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.DELIVERY_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { delivery: data?.data, deliveryByIdError: error };
};

// Pickups
export const useGetPendingPickups = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PENDING_PICKUPS_API, fetcher);
  return { pendingPickupsList: data?.data, pendingPickupsError: error };
};
export const useGetPickups = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PICKUP_API, fetcher);
  return { pickupsList: data?.data, pickupsError: error };
};
export const useGetPickupById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.PICKUP_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { pickup: data?.data, pickupByIdError: error };
};

// Changes
export const useGetPendingChanges = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PENDING_CHANGES_API, fetcher);
  return { pendingChangesList: data?.data, pendingChangesError: error };
};
export const useGetChanges = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_CHANGES_API, fetcher);
  return { changesList: data?.data, changesError: error };
};
export const useGetChangeById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.CHANGE_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { change: data?.data, changeByIdError: error };
};

// Payments
export const useGetPayments = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PAYMENTS_API, fetcher);
  return { paymentsList: data?.data, paymentsError: error };
};

// Reports
export const useGetReport = (
  fetcher,
  filter,
  startDate = null,
  endDate = null
) => {
  let url = `${ROUTES.REPORT_API}?filter=${filter}`;
  url =
    url + (startDate ? `&start=${formatTZDate(startDate, 'YYYY-MM-DD')}` : '');
  url = url + (endDate ? `&end=${formatTZDate(endDate, 'YYYY-MM-DD')}` : '');
  const { data, error } = useSWR(url, fetcher);
  return { reportData: data?.data, reportError: error };
};

// Machines Report
export const useGetMachinesReport = (fetcher) => {
  const { data, error } = useSWR(ROUTES.MACHINES_REPORT_API, fetcher);
  return { reportData: data?.data, reportError: error };
};

// Operators
export const useGetOperators = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_OPERATORS, fetcher);
  return { operatorsList: data?.data, operatorsError: error };
};

// Users
export const useGetUsers = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_USERS, fetcher);
  return { userList: data?.data, userError: error };
};

// Roles
export const useGetRoles = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_ROLES, fetcher);
  return { rolesList: data?.data, rolesError: error };
};

// Partners
export const useGetPartners = (fetcher, detailed = false) => {
  const { data, error } = useSWR(
    ROUTES.ALL_PARTNERS + (detailed ? '?detailed=true' : ''),
    fetcher,
    noRefreshOptions
  );
  return { partnersList: data?.data, partnersError: error };
};

export const useGetPartnerMachines = (fetcher, partnerId = null) => {
  const { data, error } = useSWR(
    ROUTES.PARTNER_MACHINES + (partnerId ? '?partner=' + partnerId : ''),
    fetcher,
    noRefreshOptions
  );
  return { machinesList: data?.data, machinesListError: error };
};

// Partners
export const useGetPayouts = (fetcher, partnerId = null) => {
  const { data, error } = useSWR(
    ROUTES.ALL_PAYOUTS + (partnerId ? '?partner=' + partnerId : ''),
    fetcher,
    noRefreshOptions
  );
  return { payoutsList: data?.data, payoutsError: error };
};
