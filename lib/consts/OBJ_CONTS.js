import { format } from "date-fns";
import es from "date-fns/locale/es";
import { capitalizeFirstLetter } from "lib/client/utils";
import numeral from "numeral";

export const HOW_FOUND_LIST = {
  referred: "Referido",
  facebook: "Facebook",
  recommended: "Recomendado",
  ads: "Publicidad",
  workerRef: "Empleado",
  old: "Sistema anterior"
};

export const MACHINE_STATUS_LIST = {
  RENTADO: "RENTADO",
  VEHI: "VEHI",
  LISTO: "LISTO",
  ESPE: "ESPE",
  MANTE: "MANTE",
  REC: "REC",
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
  ADD: "Agregar saldo"
};

export const PAYMENT_METHODS = {
  TRANSFER: "Transferencia",
  DEP: "Depósito",
  CASH: "Efectivo",
  CASH_OFFICE: "Efectivo (Oficina)"
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
export const TITLES_MAP = {
  contract: "Contrato",
  front: "Frente",
  board: "Tablero",
  tag: "Etiqueta"
}

export const DELIVERY_FORMAT =
  "Entrega _dNum" +
  "\n--------------------------" +
  "\nCliente: _cName" +
  "\nTeléfono: _cCell" +
  "\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef" +
  "\nAsunto: ENTREGA" +
  "\nFecha: _date_spec" +
  "\nPAGO: $_rPay" +
  "\nADEUDO: $_rDebt" +
  "\n--------------------------" +
  "\nUbicación: _maps";

export const PICKUP_FORMAT =
  "Recolección _rNum" +
  "\n--------------------------" +
  "\n#Equipo: _rMachine" +
  "\nCliente: _cName" +
  "\nTeléfono: _cCell" +
  "\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef" +
  "\nAsunto: RECOLECCIÓN" +
  "\nFecha: _date_spec" +
  "\n--------------------------" +
  "\nUbicación: _maps";

export const CHANGE_FORMAT =
  "Cambio _rNum" +
  "\n--------------------------" +
  "\n#Equipo: _rMachine" +
  "\nCliente: _cName" +
  "\nTeléfono: _cCell" +
  "\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef" +
  "\nAsunto: CAMBIO" +
  "\nMotivo de cambio: _cReason" +
  "\nFecha: _date_spec" +
  "\n--------------------------" +
  "\nUbicación: _maps";

export const getFormatForDelivery = (rent, delivery, delTime) => {
  let f = DELIVERY_FORMAT;
  f = f.replace("_dNum", delivery?.dayNumber);
  f = f.replace("_cName", rent?.customer?.name);
  f = f.replace("_cCell", rent?.customer?.cell);
  f = f.replace("_cStreet", rent?.customer?.currentResidence?.street);
  f = f.replace("_cSuburb", rent?.customer?.currentResidence?.suburb);
  
  f = f.replace("_maps", rent?.customer?.currentResidence?.maps || "No especificada");
  f = f.replace("_cRef", rent?.customer?.currentResidence?.residenceRef);
  f = f.replace(
    "_date",
    capitalizeFirstLetter(
      format(new Date(delTime?.date), "LLL dd yyyy", {
        locale: es,
      })
    )
  );
  f = f.replace(
    "_rPay",
    numeral(rent?.initialPay).format(`${rent?.initialPay}0,0.00`)
  );
  f= f.replace("_rDebt",rent?.customer?.balance < 0 ? numeral(rent?.customer?.balance).format(`${rent?.customer?.balance}0,0.00`) : 0);

  
  let time = "";
  if (delTime.timeOption === "specific") {
    time = `\nHorario especial: ${format(
      new Date(delTime?.fromTime),
      "h:mm a",
      {
        locale: es,
      }
    )} - ${format(new Date(delTime?.endTime), "h:mm a", {
      locale: es,
    })}`;
  }
  f = f.replace("_spec", time);
  return f;
};

export const getFormatForPickup = (rent, pickup, pickTime) => {
  let f = PICKUP_FORMAT;
  f = f.replace("_rNum", pickup?.dayNumber);
  f = f.replace("_rMachine", rent?.machine?.machineNum);
  f = f.replace("_cName", rent?.customer?.name);
  f = f.replace("_cCell", rent?.customer?.cell);
  f = f.replace("_cStreet", rent?.customer?.currentResidence?.street);
  f = f.replace("_cSuburb", rent?.customer?.currentResidence?.suburb);
  f = f.replace("_maps", rent?.customer?.currentResidence?.maps);
  f = f.replace("_cRef", rent?.customer?.currentResidence?.residenceRef);
  f = f.replace(
    "_date",
    capitalizeFirstLetter(
      format(new Date(pickTime?.date), "LLL dd yyyy", {
        locale: es,
      })
    )
  );
  f = f.replace(
    "_rPay",
    numeral(rent?.initialPay).format(`${rent?.initialPay}0,0.00`)
  );
  let time = "";
  if (pickTime.timeOption === "specific") {
    time = `\nHorario especial: ${format(
      new Date(pickTime?.fromTime),
      "h:mm a",
      {
        locale: es,
      }
    )} - ${format(new Date(pickTime?.endTime), "h:mm a", {
      locale: es,
    })}`;
  }
  f = f.replace("_spec", time);
  return f;
};

export const getFormatForChange = (rent, change, reason, changeTime) => {
  let f = CHANGE_FORMAT;
  f = f.replace("_rNum", change?.dayNumber);
  f = f.replace("_cName", rent?.customer?.name);
  f = f.replace("_rMachine", rent?.machine?.machineNum);
  f = f.replace("_cCell", rent?.customer?.cell);
  f = f.replace("_cReason", reason);
  f = f.replace("_cStreet", rent?.customer?.currentResidence?.street);
  f = f.replace("_cSuburb", rent?.customer?.currentResidence?.suburb);
  f = f.replace("_maps", rent?.customer?.currentResidence?.maps);
  f = f.replace("_cRef", rent?.customer?.currentResidence?.residenceRef);
  f = f.replace(
    "_date",
    capitalizeFirstLetter(
      format(new Date(changeTime?.date), "LLL dd yyyy", {
        locale: es,
      })
    )
  );
  f = f.replace(
    "_rPay",
    numeral(rent?.initialPay).format(`${rent?.initialPay}0,0.00`)
  );
  let time = "";
  if (changeTime.timeOption === "specific") {
    time = `\nHorario especial: ${format(
      new Date(changeTime?.fromTime),
      "h:mm a",
      {
        locale: es,
      }
    )} - ${format(new Date(changeTime?.endTime), "h:mm a", {
      locale: es,
    })}`;
  }
  f = f.replace("_spec", time);
  return f;
};
