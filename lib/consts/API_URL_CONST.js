export const ROUTES = {
  // Customers
  ALL_CUSTOMERS_API: '/api/customers',
  ALL_CUSTOMERS_FOR_RENT_API: '/api/customers/for-rent',
  ALL_CUSTOMERS_LEVELS_API: '/api/customers/levels',
  CUSTOMER_BY_ID_API: '/api/customers/:id',
  // Cities
  ALL_CITIES: '/api/cities',
  // Machines
  ALL_MACHINES_API: '/api/machines',
  ALL_MACHINES_FOR_RENT_API: '/api/machines/for-delivery',
  ALL_MACHINES_STATUS_API: '/api/machines/status',
  ALL_MACHINES_LOCATIONS_API: '/api/machines/locations',
  MACHINE_BY_ID_API: '/api/machines/:id',
  // Warehouses
  ALL_WAREHOUSES_OVERVIEW_API: '/api/warehouses',
  // Vehicles
  ALL_VEHICLES_API: '/api/vehicles',
  // Rents
  ALL_RENTS_API: '/api/rents',
  RENT_BY_ID_API: '/api/rents/:id',
  ALL_EXTEND_RENTS: '/api/rents/extend',
  ALL_PAST_RENTS_API: '/api/rents/past',
  ALL_BONUS_RENTS_API: '/api/rents/bonus',
  //
  ALL_PRICES_API: '/api/prices',
  // Deliveries
  ALL_DELIVERIES_API: '/api/deliveries',
  ALL_PENDING_DELIVERIES_API: '/api/deliveries/pending',
  DELIVERY_BY_ID_API: '/api/deliveries/:id',
  // Payments
  ALL_PAYMENTS_API: '/api/payments',
  DAILY_PAYMENTS_TOTAL_API: '/api/payments/daily-total',
  // Payment Accounts
  ALL_PAYMENT_ACCOUNTS_API: '/api/payments/accounts',
  // Pickups
  ALL_PICKUP_API: '/api/pickups',
  ALL_PENDING_PICKUPS_API: '/api/pickups/pending',
  ALL_PICKUPS_PROMISE_API: '/api/pickups/promise',
  ALL_INVESTIGATIONS_API: '/api/pickups/investigations',
  RESOLVE_INVESTIGATION_API: '/api/pickups/resolve-investigation',
  MARK_LOST_API: '/api/pickups/mark-lost',
  PICKUP_BY_ID_API: '/api/pickups/:id',
  // Changes
  ALL_CHANGES_API: '/api/changes',
  ALL_PENDING_CHANGES_API: '/api/changes/pending',
  CHANGE_BY_ID_API: '/api/changes/:id',
  // Reports
  REPORT_API: '/api/reports',
  MACHINES_REPORT_API: '/api/machines/status/report',
  MACHINES_RENTED_REPORT_API: '/api/machines/status/report/on-rent',
  //Files
  ALL_FILES_API: '/api/files',
  // Operators
  ALL_OPERATORS: '/api/operators',
  // Users
  ALL_USERS: '/api/users',
  ALL_ROLES: '/api/users/roles',
  ALL_USER_UNLOCKS: '/api/users/unlocks',
  //Partners
  ALL_PARTNERS: '/api/partners',
  PARTNER_MACHINES: '/api/partners/my-machines',
  //Payouts
  ALL_PAYOUTS: '/api/payouts',
  //Inventory
  ALL_PRODUCTS: '/api/inventory/products',
  ALL_PRODUCTS_ENTRIES: '/api/inventory/products/entries',
  ALL_PRODUCTS_USED: '/api/inventory/products/used',
  //Mantainances
  ALL_MANTAINANCES: '/api/mantainances/',
  ALL_PENDING_MANTAINANCES: '/api/mantainances/pending',
  MANTAINANCE_BY_ID_API: '/api/mantainances/:id',
  USED_PRODUCT_API: '/api/mantainances/used-product',
  MANTAINANCES_ALERT_API: '/api/mantainances/alert',
  // Tecnicians
  ALL_TECHNICIANS: '/api/tecnicians',
  TECHNICIAN_BONUSES: '/api/tecnicians/bonuses',
  COLLECTED_MACHINES_API: '/api/tecnicians/collected',
  RECEIVE_EQUIPMENT_API: '/api/tecnicians/receive-equipment',
  // Technician Tools (Herramientas)
  ALL_TECHNICIAN_TOOLS: '/api/technician-tools',
  TECHNICIAN_TOOLS_CONFIRM: '/api/technician-tools/confirm',
  TECHNICIAN_TOOLS_AUX_PENDING: '/api/technician-tools/aux-pending',
  // Pendientes (Pending actions for AUX)
  ALL_PENDING_ACTIONS: '/api/pendientes',
  // Sales
  ALL_SALES_MACHINES_API: '/api/sales-machines',
  SALE_MACHINE_BY_ID_API: '/api/sales-machines/:id',
  COLLECTED_SALES_MACHINES_API: '/api/sales-machines/collected',
  RECEIVE_SALES_MACHINE_API: '/api/sales-machines/receive',
  ALL_SALES_API: '/api/sales/all',
  ALL_PENDING_SALES_API: '/api/sales/pending',
  ASSIGN_SALE_API: '/api/sales/assign',
  SAVE_SALE_API: '/api/sales/save',
  COMPLETE_SALE_DELIVERY_API: '/api/sales/complete-delivery',
  COMPLETE_REPAIR_RETURN_API: '/api/sales/complete-repair-return',
  // Sale Pickups (Warranty Claims)
  ALL_SALE_PICKUPS_API: '/api/sales/pickups',
  ALL_PENDING_SALE_PICKUPS_API: '/api/sales/pickups/pending',
  SALE_PICKUP_BY_ID_API: '/api/sales/pickups/:id',
  COMPLETE_CANCELLATION_PICKUP_API: '/api/sales/pickups/complete-cancellation',
  // Sale Repairs
  ALL_SALE_REPAIRS_API: '/api/sales/repairs',
  ALL_PENDING_SALE_REPAIRS_API: '/api/sales/repairs/pending',
  SALE_REPAIR_BY_ID_API: '/api/sales/repairs/:id',
  SALE_REPAIR_USED_PRODUCT_API: '/api/sales/repairs/used-product',
  REGISTER_SALE_PAYMENT_API: '/api/sales/payment',
  ALL_SALE_PAYMENTS_API: '/api/sales/payments',
  CANCEL_SALE_API: '/api/sales/cancel',
  CANCEL_ACTIVE_SALE_API: '/api/sales/cancel-active',
    
  // Collections
  ALL_PENDING_COLLECTIONS_API: '/api/collections/pending',
  COLLECTION_VISIT_API: '/api/sales/collection-visit',
  COMPLETE_COLLECTION_API: '/api/collections/complete',
  COMPLETED_COLLECTIONS_API: '/api/collections/completed',
  
  // Tasks
  SCHEDULED_SLOTS_API: '/api/tasks/scheduled-slots',
  SCHEDULE_TASK_API: '/api/tasks/schedule',
  
  // Extra Trips
  EXTRA_TRIPS_API: '/api/extra-trips',
  ALL_PENDING_EXTRA_TRIPS_API: '/api/extra-trips/pending',
  ALL_COMPLETED_EXTRA_TRIPS_API: '/api/extra-trips/completed',
  EXTRA_TRIPS_ASSIGN_API: '/api/extra-trips/assign',
  EXTRA_TRIPS_COMPLETE_API: '/api/extra-trips/complete',
  EXTRA_TRIPS_CANCEL_API: '/api/extra-trips/cancel',
  EXTRA_TRIPS_SCHEDULE_API: '/api/extra-trips/schedule',
  
  // Payroll
  ALL_AUX_USERS: '/api/payroll/aux-users',
  PAYROLL_CONFIG: '/api/payroll/config',
  PAYROLL_WEEKLY: '/api/payroll/weekly',
  PAYMENTS_PROGRESS: '/api/payroll/payments-progress',
  COLLECTION_BONUS: '/api/payroll/collection-bonus',

  // Warehouse Machines
  ALL_WAREHOUSE_MACHINES_API: '/api/warehouse-machines',
  WAREHOUSE_MACHINE_BY_ID_API: '/api/warehouse-machines/:id',
  WAREHOUSE_MACHINES_SUMMARY_API: '/api/warehouse-machines?summary=true',
  WAREHOUSE_CONDITIONING_API: '/api/warehouse-machines/conditioning',

  // Attendance
  ATTENDANCE_API: '/api/attendance',
  ATTENDANCE_RECORDS_API: '/api/attendance/records',
};
