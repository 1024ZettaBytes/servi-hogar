import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

// Office schedules the pickup (JSON — customer + fault + chofer + date).
export async function createExternalRepair(data) {
  try {
    const res = await axios.post(
      ROUTES.ALL_EXTERNAL_REPAIRS_API,
      JSON.stringify(data),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al agendar la recolección. Por favor intente de nuevo.'
    };
  }
}

// Route operator completes the pickup (multipart — 4 photos + condition note).
export async function completeExternalRepairPickup(formData) {
  try {
    const res = await axios.post(
      ROUTES.EXTERNAL_REPAIR_COMPLETE_PICKUP_API,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    refreshData(ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', formData.get('repairId')));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al completar la recolección. Por favor intente de nuevo.'
    };
  }
}

export async function receiveExternalRepairInWarehouse(repairId, warehouseId) {
  return putExternalRepairOperation(
    repairId,
    { operation: 'RECEIVE_WAREHOUSE', warehouseId },
    'Error al recibir el equipo en bodega.'
  );
}

export async function cancelExternalRepair(repairId, cancellationReason) {
  return putExternalRepairOperation(
    repairId,
    { operation: 'CANCEL', cancellationReason },
    'Error al cancelar la recolección.'
  );
}

export async function submitExternalRepairBudget(repairId, laborAmount) {
  try {
    const URL = ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', repairId);
    const res = await axios.put(
      URL,
      JSON.stringify({ operation: 'SUBMIT_BUDGET', laborAmount }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    refreshData(URL);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al enviar el presupuesto. Por favor intente de nuevo.'
    };
  }
}

export async function authorizeExternalRepair(repairId) {
  return putExternalRepairOperation(
    repairId,
    { operation: 'AUTHORIZE' },
    'Error al procesar la autorización.'
  );
}

export async function rejectExternalRepair(repairId) {
  return putExternalRepairOperation(
    repairId,
    { operation: 'REJECT' },
    'Error al procesar el rechazo.'
  );
}

// Technician closes the repair (multipart — evidence photos + description).
export async function completeExternalRepair(formData) {
  try {
    const res = await axios.post(
      ROUTES.EXTERNAL_REPAIR_COMPLETE_REPAIR_API,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    refreshData(
      ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', formData.get('repairId'))
    );
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al marcar la reparación como reparada. Por favor intente de nuevo.'
    };
  }
}

export async function scheduleExternalRepairDelivery(
  repairId,
  operatorId,
  scheduledDate
) {
  return putExternalRepairOperation(
    repairId,
    { operation: 'SCHEDULE_DELIVERY', operatorId, scheduledDate },
    'Error al programar la entrega.'
  );
}

export async function postponeExternalRepairDelivery(
  repairId,
  scheduledDate,
  note
) {
  return putExternalRepairOperation(
    repairId,
    { operation: 'POSTPONE_DELIVERY', scheduledDate, note },
    'Error al posponer la entrega.'
  );
}

export async function completeExternalRepairDelivery(formData) {
  try {
    const res = await axios.post(
      ROUTES.EXTERNAL_REPAIR_COMPLETE_DELIVERY_API,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    refreshData(ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', formData.get('repairId')));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al completar la entrega. Por favor intente de nuevo.'
    };
  }
}

async function putExternalRepairOperation(repairId, body, fallbackMsg) {
  try {
    const URL = ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', repairId);
    const res = await axios.put(URL, JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    refreshData(ROUTES.EXTERNAL_REPAIRS_RECOLECTADAS_API);
    refreshData(URL);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg: err?.response?.data?.errorMsg || `${fallbackMsg} Intente de nuevo.`
    };
  }
}

export async function addUsedProductToExternalRepair(repairId, productId, qty) {
  try {
    const res = await axios.post(
      ROUTES.EXTERNAL_REPAIR_USED_PRODUCT_API,
      JSON.stringify({ repairId, productId, qty }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_PRODUCTS);
    refreshData(ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', repairId));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al agregar la refacción. Por favor intente de nuevo.'
    };
  }
}

export async function removeUsedProductFromExternalRepair(
  usedInventoryId,
  repairId
) {
  try {
    const res = await axios.delete(ROUTES.EXTERNAL_REPAIR_USED_PRODUCT_API, {
      data: JSON.stringify({ usedInventoryId }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.ALL_PRODUCTS);
    if (repairId) {
      refreshData(ROUTES.EXTERNAL_REPAIR_BY_ID_API.replace(':id', repairId));
    }
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al remover la refacción. Por favor intente de nuevo.'
    };
  }
}
