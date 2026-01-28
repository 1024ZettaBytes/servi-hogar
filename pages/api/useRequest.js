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
export const useGetAllCustomers = (fetcher, detailed = true) => {
  const { data, error } = useSWR(
    ROUTES.ALL_CUSTOMERS_API + (!detailed ? '?noDetail=true' : ''),
    fetcher
  );
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

//Sales Machines
export const useGetSalesMachineById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.SALE_MACHINE_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { saleMachine: data?.data, saleMachineByIdError: error };
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
export const useGetDeliveries = (fetcher, limit, page, searchTerm = null, date = null) => {
  let url = getPaginatedUrl(ROUTES.ALL_DELIVERIES_API, limit, page, searchTerm);
  if (date) {
    url += `&date=${formatTZDate(date, 'YYYY-MM-DD')}`;
  }
  const { data, error } = useSWR(url, fetcher);
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
export const useGetPendingPickups = (fetcher, detailed=true) => {
  const { data, error } = useSWR(ROUTES.ALL_PENDING_PICKUPS_API + (detailed ? "?detailed=true" : ""), fetcher);
  return { pendingPickupsList: data?.data, pendingPickupsError: error };
};
export const useGetPickups = (fetcher, limit, page, searchTerm = null, date = null) => {
  let url = getPaginatedUrl(ROUTES.ALL_PICKUP_API, limit, page, searchTerm);
  if (date) {
    url += `&date=${date}`;
  }
  const { data, error } = useSWR(url, fetcher);
  return { pickups: data?.data, pickupsError: error };
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

export const useGetChanges = (fetcher, limit, page, searchTerm = null, date = null) => {
  let url = getPaginatedUrl(ROUTES.ALL_CHANGES_API, limit, page, searchTerm);
  if (date) {
    url += `&date=${date}`;
  }
  const { data, error } = useSWR(url, fetcher);
  return { changes: data?.data, changesError: error };
};
export const useGetChangeById = (fetcher, id) => {
  const { data, error } = useSWR(
    id ? ROUTES.CHANGE_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { change: data?.data, changeByIdError: error };
};

// Payments
export const useGetPayments = (fetcher, limit, page, searchTerm = null) => {
  const { data, error } = useSWR(
    getPaginatedUrl(ROUTES.ALL_PAYMENTS_API, limit, page, searchTerm),
    fetcher
  );
  return { payments: data?.data, paymentsError: error };
};

export const useGetDailyPaymentsTotal = (fetcher) => {
  const { data, error } = useSWR(ROUTES.DAILY_PAYMENTS_TOTAL_API, fetcher);
  return { dailyTotal: data, dailyTotalError: error };
};

// Payment Accounts
export const useGetPaymentAccounts = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PAYMENT_ACCOUNTS_API, fetcher);
  return { paymentAccounts: data?.data, paymentAccountsError: error };
};

// Reports
export const useGetReport = (
  fetcher,
  filter,
  period,
  startDate = null,
  endDate = null,
) => {
  let url = `${ROUTES.REPORT_API}?filter=${filter}&period=${period}`;
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


export const useGetMachinesOnRentReport = (fetcher) => {
  const { data, error } = useSWR(ROUTES.MACHINES_RENTED_REPORT_API, fetcher);
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

// User Unlocks
export const useGetUserUnlocks = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_USER_UNLOCKS, fetcher);
  return { unlocksList: data?.data, unlocksError: error };
};

// Pending Actions
export const useGetPendingActions = (fetcher) => {
  const { data, error, mutate } = useSWR(ROUTES.ALL_PENDING_ACTIONS, fetcher);
  return { 
    pendingActions: data?.data, 
    pendingActionsError: error,
    mutatePendingActions: mutate
  };
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
// Inventory
export const useGetProducts = (fetcher, term = null, detailed = true) => {
  const hasTerm = term && term.trim().length > 0;
  const detChar = hasTerm ? '&' : '?';
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_PRODUCTS +
      (hasTerm ? '?term=' + term : '') +
      (detailed ? `${detChar}detailed=true` : ''),
    fetcher
  );
  return {
    productsList: data?.data,
    productsError: error,
    isLoadingProducts: isLoading
  };
};

export const useGetProductEntries = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_PRODUCTS_ENTRIES,
    fetcher
  );
  return {
    entriesList: data?.data,
    entriesError: error,
    isLoadingEntries: isLoading
  };
};

export const useGetUsedProducts = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_PRODUCTS_USED,
    fetcher
  );
  return {
    usedList: data?.data,
    usedError: error,
    isLoadingUsed: isLoading
  };
};

// Mantainances
export const useGetPendingMantainances = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_PENDING_MANTAINANCES,
    fetcher
  );
  return {
    pendingMantData: data?.data,
    pendingMantError: error,
    isLoadingPendingMant: isLoading
  };
};

export const useGetMantainances = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_MANTAINANCES,
    fetcher
  );
  return {
    mantData: data?.data,
    mantError: error,
    isLoadingMant: isLoading
  };
};

export const useGetMantainancesAlert = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.MANTAINANCES_ALERT_API,
    fetcher
  );
  return {
    alertData: data?.data,
    alertError: error,
    isLoadingAlert: isLoading
  };
};

export const useGetMantainenceById = (fetcher, id) => {
  const { data, error, isLoading } = useSWR(
    id ? ROUTES.MANTAINANCE_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return { mantData: data?.data, mantByIdError: error, isLoadingMant: isLoading };
};

// Collection
export const useGetPendingCollections = (fetcher) => {
  const { data, error } = useSWR(ROUTES.ALL_PENDING_COLLECTIONS_API, fetcher);
  return { pendingCollectionsList: data?.data, pendingCollectionsError: error };
};

export const useGetCompletedCollections = (fetcher, limit, page, date = null) => {
  let url = getPaginatedUrl(ROUTES.COMPLETED_COLLECTIONS_API, limit, page);
  if (date) {
    url += `&date=${formatTZDate(date, 'YYYY-MM-DD')}`;
  }
  const { data, error } = useSWR(url, fetcher);
  return { completedCollectionsList: data?.data, completedCollectionsError: error };
};

// Sale Pickups (Warranty Claims)
export const useGetPendingSalePickups = (fetcher, detailed = true) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_PENDING_SALE_PICKUPS_API + `?detailed=${detailed}`,
    fetcher
  );
  return {
    pendingSalePickupsList: data?.data,
    pendingSalePickupsError: error,
    isLoadingSalePickups: isLoading
  };
};

export const useGetSalePickups = (fetcher, page, limit, searchTerm = '', date = null) => {
  const queryParams = new URLSearchParams({
    page: page?.toString() || '1',
    limit: limit?.toString() || '10',
    ...(searchTerm && { searchTerm }),
    ...(date && { date })
  });
  
  const { data, error, isLoading } = useSWR(
    `${ROUTES.ALL_SALE_PICKUPS_API}?${queryParams}`,
    fetcher
  );
  return {
    salePickupsData: data?.data,
    salePickupsError: error,
    isLoadingSalePickups: isLoading
  };
};

export const useGetSalePickupById = (fetcher, id) => {
  const { data, error, isLoading } = useSWR(
    id ? ROUTES.SALE_PICKUP_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return {
    salePickup: data?.data,
    salePickupByIdError: error,
    isLoadingSalePickup: isLoading
  };
};

// Sale Repairs
export const useGetPendingSaleRepairs = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_PENDING_SALE_REPAIRS_API,
    fetcher
  );
  return {
    pendingSaleRepairsList: data?.data,
    pendingSaleRepairsError: error,
    isLoadingSaleRepairs: isLoading
  };
};

export const useGetSaleRepairs = (fetcher) => {
  const { data, error, isLoading } = useSWR(
    ROUTES.ALL_SALE_REPAIRS_API,
    fetcher
  );
  return {
    saleRepairsData: data?.data,
    saleRepairsError: error,
    isLoadingSaleRepairs: isLoading
  };
};

export const useGetSaleRepairById = (fetcher, id) => {
  const { data, error, isLoading } = useSWR(
    id ? ROUTES.SALE_REPAIR_BY_ID_API.replace(':id', id) : null,
    fetcher
  );
  return {
    saleRepairData: data?.data,
    saleRepairError: error,
    isLoadingSaleRepair: isLoading
  };
};

// Scheduled Tasks
export const useGetScheduledSlots = (fetcher, date) => {
  const { data, error, isLoading } = useSWR(
    date ? `${ROUTES.SCHEDULED_SLOTS_API}?date=${date}` : null,
    fetcher
  );
  return {
    scheduledSlotsData: data?.data,
    scheduledSlotsError: error,
    isLoadingScheduledSlots: isLoading
  };
};
