import es from 'date-fns/locale/es';
import {
  capitalizeFirstLetter,
  formatTZDate,
  dateDiffInDays,
  convertDateToTZ,
  convertDateToLocal
} from 'lib/client/utils';
import numeral from 'numeral';

export const HOW_FOUND_LIST = {
  referred: 'Recomendado',
  facebook: 'Facebook',
  ads: 'Publicidad',
  workerRef: 'Empleado',
  old: 'Sistema anterior'
};

export const MACHINE_STATUS_LIST = {
  PERDIDA: 'PERDIDA',
  RENTADO: 'RENTADO',
  VEHI: 'VEHI',
  LISTO: 'LISTO',
  ESPE: 'ESPE',
  MANTE: 'MANTE',
  REC: 'REC',
  INVES: 'INVES'
};

export const MACHINE_MOVEMENT_LIST = {
  NEW: 'NEW',
  RENT: 'RENT',
  EXT_RENT: 'EXT_RENT',
  DEBT: 'DEBT',
  EXPENSE: 'EXPENSE',
  CHANGE: 'CHANGE'
};

export const ACCESORIES_LIST = {
  MANG_CARGA: 'Manguera de carga',
  MANG_DESCAARGA: 'Manguera de descarga',
  CODO_PVC: 'Codo PVC'
};

export const PAYMENT_REASONS = {
  RENT_EXT: 'Extender renta',
  DEBT: 'Saldar deuda',
  ADD: 'Agregar saldo',
  EXTERNAL_REPAIR: 'Reparación externa'
};

export const PLAN_ORO = {
  WEEKS: 4,
  PRICE: 499
};

export const PLAN_99 = {
  WEEKS: 1,
  PRICE: 99
};

export const PAYOUT_KEYS = {
  NEW: 'NEW',
  EXTENDED: 'EXTENDED',
  NA: 'NA',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED'
};

export const PAYMENT_METHODS = {
  TRANSFER: 'Transferencia',
  DEP: 'Depósito',
  CASH: 'Efectivo',
  CASH_OFFICE: 'Efectivo (Oficina)'
};

// El método de pago determina a qué corte pertenece el efectivo:
// CASH lo cobra el personal de ruta en la calle (cobranza, enganches y
// entregas de reparación externa) y lo deposita al cerrar su turno;
// CASH_OFFICE se recibe en ventanilla y entra a la caja de oficina.
export const ROUTE_CASH_METHOD = 'CASH';
export const OFFICE_CASH_METHOD = 'CASH_OFFICE';
export const CASH_PAYMENT_METHODS = [ROUTE_CASH_METHOD, OFFICE_CASH_METHOD];

/**
 * Métodos de pago que se le ofrecen a un usuario según dónde recibe el dinero.
 * El personal de ruta nunca cobra en la ventanilla de la oficina, así que no
 * se le muestra CASH_OFFICE: su efectivo siempre es CASH y va a su corte de
 * ruta. Si pudiera elegirlo, el dinero se contaría en la caja de oficina
 * mientras él lo trae en la bolsa.
 */
export const getPaymentMethodsForRole = (role) =>
  Object.keys(PAYMENT_METHODS).filter(
    (method) => !(role === 'OPE' && method === OFFICE_CASH_METHOD)
  );

export const CASH_CUT_TYPES = {
  RUTA: 'Ruta',
  OFICINA: 'Oficina'
};

export const CASH_CUT_STATUS = {
  PENDIENTE_DEPOSITO: 'Pendiente de depósito',
  DEPOSITADO: 'Depositado',
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmar',
  CONFIRMADO: 'Confirmado'
};

// Roles cuyo efectivo pertenece a la caja de oficina. El resto (OPE) hace
// corte de ruta y deposita.
export const OFFICE_CASH_ROLES = ['ADMIN', 'AUX'];

// Fecha desde la que el corte de caja considera cobros. Todo lo cobrado antes
// del lanzamiento queda fuera: el campo `cashCut` es nuevo y sin este límite el
// primer corte arrastraría todo el efectivo histórico de la base.
// Se puede sobrescribir con la variable de entorno CASH_CUT_START_DATE.
export const CASH_CUT_START_DATE = new Date(
  process.env.CASH_CUT_START_DATE || '2026-08-19T00:00:00'
);

export const CASH_EXPENSE_CONCEPTS = {
  COMPRA: 'Compra',
  PAGO: 'Pago',
  VIATICOS: 'Viáticos',
  COMBUSTIBLE: 'Combustible',
  MANTENIMIENTO: 'Mantenimiento',
  OTRO: 'Otro'
};

export const WAREHOUSE_MACHINE_STATUS = {
  ALMACENADA: 'ALMACENADA',
  EN_VEHICULO: 'EN_VEHICULO',
  EN_ACONDICIONAMIENTO: 'EN_ACONDICIONAMIENTO',
  ACONDICIONADA: 'ACONDICIONADA',
  DESMANTELADA: 'DESMANTELADA',
  ASIGNADA_RENTA: 'ASIGNADA_RENTA',
  CONVERTIDA_VENTA: 'CONVERTIDA_VENTA',
  DE_REEMPLAZO: 'DE_REEMPLAZO'
};

export const WAREHOUSE_MACHINE_STATUS_LABELS = {
  ALMACENADA: 'Almacenada',
  EN_VEHICULO: 'En vehículo',
  EN_ACONDICIONAMIENTO: 'En acondicionamiento',
  ACONDICIONADA: 'Acondicionada',
  DESMANTELADA: 'Desmantelada',
  ASIGNADA_RENTA: 'Asignada a renta',
  CONVERTIDA_VENTA: 'Convertida a venta',
  DE_REEMPLAZO: 'De reemplazo'
};

export const WAREHOUSE_MACHINE_ORIGIN = {
  NUEVA: 'NUEVA',
  REPUESTA: 'REPUESTA',
  COMPRA_CALLE: 'COMPRA_CALLE',
  CAMBIO_VENTA: 'CAMBIO_VENTA',
  CONVERSION_RENTA: 'CONVERSION_RENTA'
};

export const WAREHOUSE_MACHINE_ORIGIN_LABELS = {
  NUEVA: 'Nueva (Mexicali)',
  REPUESTA: 'Repuesta',
  COMPRA_CALLE: 'Compra en calle',
  CAMBIO_VENTA: 'Cambio de venta',
  CONVERSION_RENTA: 'Conversión de Renta'
};

export const WAREHOUSE_ORIGIN_COLORS = {
  NUEVA: 'info',
  REPUESTA: 'warning',
  COMPRA_CALLE: 'success',
  CONVERSION_RENTA: 'secondary'
};
export const WEEK_DAYS = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
};
export const TITLES_MAP = {
  contract: 'INE',
  front: 'Casa',
  board: 'Tablero',
  tag: 'Etiqueta',
  // Sale delivery images
  ine: 'INE',
  frontal: 'Casa',
  label: 'Etiqueta',
  // Payment image
  payment: 'Comprobante de Pago'
};

export const PAYOUT_CONSTS = {
  INITIAL_MANT: 25,
  COMISION: 5,
  YEARLY_MANT: 5,
  YEARLY_DEPRECIATION: 19
};

export const DELIVERY_FORMAT =
  'Entrega _dNum' +
  '\n--------------------------' +
  '\nCliente: _cName' +
  '\n_cLast' +
  '\nTeléfono: _cCell' +
  '\nNombre Ref: _rName' +
  '\nTel. Ref: _rCell' +
  '\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef' +
  '\nAsunto: ENTREGA' +
  '\nFecha: _date_spec' +
  '\nPAGO: $_rPay' +
  '\nADEUDO: $_rDebt' +
  '\n--------------------------' +
  '\nUbicación: _maps';

export const PICKUP_FORMAT =
  'Recolección _rNum' +
  '\n--------------------------' +
  '\n#Equipo: _rMachine' +
  '\nCliente: _cName' +
  '\nTeléfono: _cCell' +
  '\nNombre Ref: _rName' +
  '\nTel. Ref: _rCell' +
  '\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef' +
  '\nAsunto: RECOLECCIÓN' +
  '\nFecha: _date_spec' +
  '\nADEUDO: $_rDebt' +
  '\n#Tiempo renta: _rDays' +
  '\nAccesorios: _rAcce' +
  '\n--------------------------' +
  '\nUbicación: _maps';

export const CHANGE_FORMAT =
  'Cambio _rNum' +
  '\n--------------------------' +
  '\n#Equipo: _rMachine' +
  '\nCliente: _cName' +
  '\nTeléfono: _cCell' +
  '\nNombre Ref: _rName' +
  '\nTel. Ref: _rCell' +
  '\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef' +
  '\nAsunto: CAMBIO' +
  '\nMotivo de cambio: _cReason' +
  '\nFecha: _date_spec' +
  '\n#Tiempo renta: _rDays' +
  '\n--------------------------' +
  '\nUbicación: _maps';

export const SALE_FORMAT =
  'Venta #_sNum' +
  '\n--------------------------' +
  '\nFolio: _sFolio' +
  '\n#Equipo: _sMachine' +
  '\nCliente: _cName' +
  '\n_cLast' +
  '\nTeléfono: _cCell' +
  '\nNombre Ref: _rName' +
  '\nTel. Ref: _rCell' +
  '\nDirección: Calle _cStreet, Colonia _cSuburb, _cRef' +
  '\nAsunto: _subject' +
  '\nPAGO INICIAL: $_sPay' +
  '\nTOTAL: $_sTotal' +
  '\nSEMANAS: _sWeeks' +
  '\n--------------------------' +
  '\nUbicación: _maps';

export const getFormatForDelivery = (rent, delivery, delTime) => {
  let f = DELIVERY_FORMAT;
  f = f.replace('_dNum', delivery?.dayNumber);
  f = f.replace('_cName', rent?.customer?.name);
  f = f.replace(
    '_cLast',
    rent?.customer?.lastRent
      ? 'Última renta: ' +
          capitalizeFirstLetter(
            formatTZDate(new Date(rent?.customer?.lastRent), 'MMM DD YYYY')
          )
      : 'CLIENTE NUEVO'
  );
  f = f.replace('_cCell', rent?.customer?.cell);
  f = f.replace('_rName', rent?.customer?.currentResidence?.nameRef);
  f = f.replace('_rCell', rent?.customer?.currentResidence?.telRef);
  f = f.replace('_cStreet', rent?.customer?.currentResidence?.street);
  f = f.replace('_cSuburb', rent?.customer?.currentResidence?.suburb);
  f = f.replace(
    '_maps',
    rent?.customer?.currentResidence?.maps || 'No especificada'
  );
  f = f.replace('_cRef', rent?.customer?.currentResidence?.residenceRef);
  f = f.replace(
    '_date',
    capitalizeFirstLetter(formatTZDate(new Date(delTime?.date), 'MMM DD YYYY'))
  );
  f = f.replace(
    '_rPay',
    numeral(rent?.initialPay).format(`${rent?.initialPay}0,0.00`)
  );
  f = f.replace(
    '_rDebt',
    rent?.customer?.balance < 0
      ? numeral(rent?.customer?.balance).format(
          `${rent?.customer?.balance}0,0.00`
        )
      : 0
  );

  let time = '';
  if (delTime.timeOption === 'specific') {
    time = `\nHorario especial: ${formatTZDate(
      new Date(delTime?.fromTime),
      'h:mm A'
    )} - ${formatTZDate(new Date(delTime?.endTime), 'h:mm A')}`;
  }
  f = f.replace('_spec', time);
  return f;
};

export const getFormatForSale = (sale, type = 'sale') => {
  let f = SALE_FORMAT;

  let subject = 'VENTA';

  if (type === 'delivery') {
    subject = 'ENTREGA DE VENTA';
  }

  if (type === 'pickup') {
    subject = 'RECOLECCIÓN DE VENTA';
  }

  f = f.replace('_subject', subject);
  f = f.replace('_sNum', sale?.saleNum || 'N/A');
  f = f.replace('_sFolio', sale?.saleNum || 'N/A');
  
  // Handle machine info - could be existing machine or just serial number
  let machineInfo = 'N/A';
  if (sale?.machine) {
    machineInfo = `${sale.machine.machineNum} (${sale.machine.brand} ${sale.machine.capacity}kg)`;
  } else if (sale?.serialNumber) {
    machineInfo = `Serie: ${sale.serialNumber}`;
  }
  f = f.replace('_sMachine', machineInfo);
  
  f = f.replace('_cName', sale?.customer?.name || 'N/A');
  f = f.replace(
    '_cLast',
    sale?.customer?.lastRent
      ? 'Última renta: ' +
          capitalizeFirstLetter(
            formatTZDate(new Date(sale?.customer?.lastRent), 'MMM DD YYYY')
          )
      : 'CLIENTE NUEVO'
  );
  f = f.replace('_cCell', sale?.customer?.cell || 'N/A');
  f = f.replace('_rName', sale?.customer?.currentResidence?.nameRef || 'N/A');
  f = f.replace('_rCell', sale?.customer?.currentResidence?.telRef || 'N/A');
  f = f.replace('_cStreet', sale?.customer?.currentResidence?.street || 'N/A');
  f = f.replace('_cSuburb', sale?.customer?.currentResidence?.suburb || 'N/A');
  f = f.replace(
    '_maps',
    sale?.customer?.currentResidence?.maps || 'No especificada'
  );
  f = f.replace('_cRef', sale?.customer?.currentResidence?.residenceRef || 'N/A');
  f = f.replace(
    '_sPay',
    numeral(sale?.initialPayment).format(`${sale?.initialPayment}0,0.00`)
  );
  f = f.replace(
    '_sTotal',
    numeral(sale?.totalAmount).format(`${sale?.totalAmount}0,0.00`)
  );
  f = f.replace('_sWeeks', sale?.totalWeeks || 'N/A');
  return f;
};

export const getFormatForPickup = (rent, pickup, pickTime, dayPrice) => {
  const overdue = rent.remaining;
  const totalDebt = getCustomerDebt(overdue, dayPrice);
  let f = PICKUP_FORMAT;
  f = f.replace('_rNum', pickup?.dayNumber);
  f = f.replace('_rMachine', rent?.machine?.machineNum);
  f = f.replace('_cName', rent?.customer?.name);
  f = f.replace('_cCell', rent?.customer?.cell);
  f = f.replace('_rName', rent?.customer?.currentResidence?.nameRef);
  f = f.replace('_rCell', rent?.customer?.currentResidence?.telRef);
  f = f.replace('_cStreet', rent?.customer?.currentResidence?.street);
  f = f.replace('_cSuburb', rent?.customer?.currentResidence?.suburb);
  f = f.replace('_maps', rent?.customer?.currentResidence?.maps);
  f = f.replace(
    '_rDays',
    `${dateDiffInDays(new Date(rent?.startDate), new Date())} día(s)`
  );
  let accesoriesToPick = '';
  if (rent.accesories)
    Object.keys(rent.accesories).forEach((key) => {
      if (ACCESORIES_LIST[key]) {
        accesoriesToPick += '\n' + ACCESORIES_LIST[key];
      }
    });
  f = f.replace('_rAcce', accesoriesToPick);
  f = f.replace('_cRef', rent?.customer?.currentResidence?.residenceRef);
  f = f.replace(
    '_date',
    capitalizeFirstLetter(formatTZDate(new Date(pickTime?.date), 'MMM DD YYYY'))
  );
  f = f.replace(
    '_rPay',
    numeral(rent?.initialPay).format(`${rent?.initialPay}0,0.00`)
  );
  f = f.replace('_rDebt', numeral(totalDebt).format(`${totalDebt}0,0.00`));
  let time = '';
  if (pickTime.timeOption === 'specific') {
    time = `\nHorario especial: ${formatTZDate(
      new Date(pickTime?.fromTime),
      'h:mm A'
    )} - ${formatTZDate(new Date(pickTime?.endTime), 'h:mm A')}`;
  }
  f = f.replace('_spec', time);
  return f;
};

export const getFormatForChange = (rent, change, reason, changeTime) => {
  let f = CHANGE_FORMAT;
  f = f.replace('_rNum', change?.dayNumber);
  f = f.replace('_cName', rent?.customer?.name);
  f = f.replace('_rMachine', rent?.machine?.machineNum);
  f = f.replace('_cCell', rent?.customer?.cell);
  f = f.replace('_rName', rent?.customer?.currentResidence?.nameRef);
  f = f.replace('_rCell', rent?.customer?.currentResidence?.telRef);
  f = f.replace('_cReason', reason);
  f = f.replace('_cStreet', rent?.customer?.currentResidence?.street);
  f = f.replace('_cSuburb', rent?.customer?.currentResidence?.suburb);
  f = f.replace('_maps', rent?.customer?.currentResidence?.maps);
  f = f.replace('_cRef', rent?.customer?.currentResidence?.residenceRef);
  f = f.replace(
    '_rDays',
    `${dateDiffInDays(new Date(rent?.startDate), new Date())} día(s)`
  );

  f = f.replace(
    '_date',
    capitalizeFirstLetter(
      formatTZDate(new Date(changeTime?.date), 'MMM DD YYYY')
    )
  );
  f = f.replace(
    '_rPay',
    numeral(rent?.initialPay).format(`${rent?.initialPay}0,0.00`)
  );
  let time = '';
  if (changeTime.timeOption === 'specific') {
    time = `\nHorario especial: ${formatTZDate(
      new Date(changeTime?.fromTime),
      'h:mm A'
    )} - ${formatTZDate(new Date(changeTime?.endTime), 'h:mm A')}`;
  }
  f = f.replace('_spec', time);
  return f;
};

export const getCustomerDebt = (overdue, dayPrice) => {
  return overdue < 0? Math.abs(overdue) * dayPrice : 0;
};

export const MAPS_BASE_URL = 'https://maps.google.com/maps?q=[LAT],[LON]';

// Motivos por los que un cliente acumula o gasta semanas gratis de renta.
// Se registran en Customer.freeWeeksHistory para poder explicar el saldo.
export const FREE_WEEK_REASONS = {
  RECOMENDACION: 'RECOMENDACION',
  CAMBIOS_CONSECUTIVOS: 'CAMBIOS_CONSECUTIVOS',
  USO: 'USO'
};

// Cambios consecutivos dentro de una renta que otorgan una semana gratis.
export const CHANGES_FOR_FREE_WEEK = 4;

export const FREE_WEEK_REASON_LABELS = {
  [FREE_WEEK_REASONS.RECOMENDACION]: 'Por recomendar un cliente',
  [FREE_WEEK_REASONS.CAMBIOS_CONSECUTIVOS]: `Por ${CHANGES_FOR_FREE_WEEK} cambios consecutivos`,
  [FREE_WEEK_REASONS.USO]: 'Aplicadas a una renta'
};
