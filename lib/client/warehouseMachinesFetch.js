import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function saveWarehouseMachine(data) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/save`;
  try {
    const res = await fetch(url, { method: 'POST', body: data });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al guardar' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function updateWarehouseMachine(data) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/update`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al actualizar' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function deleteWarehouseMachine(machineId) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/delete`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({ machineId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al eliminar' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function assignTechnician(warehouseMachineId, technicianId, warehouseId) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/assign-technician`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ warehouseMachineId, technicianId, warehouseId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      await refreshData(ROUTES.WAREHOUSE_CONDITIONING_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al asignar técnico' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function completeConditioning(formData) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/complete-conditioning`;
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ACONDICIONADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      await refreshData(ROUTES.WAREHOUSE_CONDITIONING_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al completar acondicionamiento' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function loadToVehicle(warehouseMachineId, operatorId) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/load-to-vehicle`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ warehouseMachineId, operatorId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ACONDICIONADA");
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=EN_VEHICULO");
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=EN_VEHICULO&fields=minimal");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.errorMsg || 'Error al cargar al vehículo' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function dismantleWarehouseMachine(warehouseMachineId) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/dismantle`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ warehouseMachineId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ACONDICIONADA");
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=DESMANTELADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.errorMsg || 'Error al desmantelar' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function moveToSale(warehouseMachineId) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/move-to-sale`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ warehouseMachineId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ACONDICIONADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.errorMsg || 'Error al pasar a venta' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function registerStreetPurchase(formData) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/register-purchase`;
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=EN_VEHICULO");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al registrar compra' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function receiveWarehouseMachine(warehouseMachineId, warehouseId) {
  const url = `${ROUTES.ALL_WAREHOUSE_MACHINES_API}/receive`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ warehouseMachineId, warehouseId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=EN_VEHICULO");
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg };
    }
    return { error: true, msg: json.error || 'Error al recibir máquina' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function getInactiveRentalMachines() {
  const url = ROUTES.INACTIVE_MACHINES_API;
  try {
    const res = await fetch(url, { method: 'GET' });
    const json = await res.json();
    if (res.ok) {
      return { error: false, data: json.data };
    }
    return { error: true, msg: json.errorMsg || 'Error al obtener máquinas inactivas' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}

export async function replaceRentalMachine(warehouseMachineId, machineToReplaceId, warehouseId) {
  const url = ROUTES.REPLACE_RENTAL_MACHINE_API;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ warehouseMachineId, machineToReplaceId, warehouseId }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (res.ok) {
      await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ACONDICIONADA");
      await refreshData(ROUTES.WAREHOUSE_MACHINES_SUMMARY_API);
      return { error: false, msg: json.msg, data: json.data };
    }
    return { error: true, msg: json.errorMsg || 'Error al reemplazar máquina' };
  } catch (err) {
    return { error: true, msg: 'Error de conexión' };
  }
}
