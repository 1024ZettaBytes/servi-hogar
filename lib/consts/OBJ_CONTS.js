export const HOW_FOUND_LIST = {
  referred: "Referido",
  facebook: "Facebook",
  recommended: "Recomendado",
  ads: "Publicidad",
  workerRef: "Empleado",
};

export const MACHINE_STATUS_LIST = {
  RENTADO: "RENTADO",
  VEHI: "VEHI",
  LISTO: "LISTO",
  ESPE: "ESPE",
  MANTE: "MANTE",
};

export const MACHINE_MOVEMENT_LIST = {
  NEW: "NEW",
  RENT: "RENT",
  EXT_RENT: "EXT_RENT",
  EXPENSE: "EXPENSE",
};

export const ACCESORIES_LIST = {
  MANG_CARGA: "Manguera de carga",
  MANG_DESCAARGA: "Manguera de descarga",
  CODO_PVC: "Codo PVC",
};

export const PAYMENT_REASONS = {
  RENT_EXT: "Extender renta",
  DEBT: "Saldar deuda",
};

export const PAYMENT_METHODS = {
  TRANSFER: "Transferencia",
  DEP: "Depósito",
  CASH: "Efectivo",
};
export const WEEK_DAYS = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};
// TODO: replace ths cponst with api call when needed
export const PRICES = {
  week: 139.0,
  day: 20.0,
};
export const DELIVERY_FORMAT =
  "Entrega _dNum" +
  "\n--------------------------" +
  "\nCliente: _cName" +
  "\nTeléfono: _cCell" +
  "\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef " +
  "\nAsunto: ENTREGA" +
  "\nPAGO: $_rPay" +
  "\n--------------------------";
