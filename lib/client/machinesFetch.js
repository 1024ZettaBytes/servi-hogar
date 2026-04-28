import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";
export async function saveMachine(formData) {
  try {
    const res = await fetch(ROUTES.ALL_MACHINES_API, {
      method: 'POST',
      body: formData 
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: true, msg: json.errorMsg };
    }

    refreshData(ROUTES.ALL_MACHINES_API);
    return { error: false, msg: json.msg };

  } catch (err) {
    return {
      error: true,
      msg: "Error al guardar el equipo. Por favor intente de nuevo."
    };
  }
}

export async function updateMachine(attachment, machineData) {
  try {
    const URL = ROUTES.MACHINE_BY_ID_API.replace(":id", machineData._id);
    const json = JSON.stringify(machineData);
    const data = new FormData();
    data.append("body", json);
    if (attachment) {
      Object.keys(attachment).forEach((key) => {
        data.append(key, attachment[key].file);
      });
    }
    const res = await axios.put(URL, data, {
      headers: {
        Accept: "application/json ,text/plain, */*",
        "Content-Type": "multipart/form-data",
      },
    });
    await refreshData(URL);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al actualizar el equipo. Por favor intente de nuevo.",
    };
  }
}
export async function deleteMachines(machinesArray) {
  try {
    const res = await axios.delete(ROUTES.ALL_MACHINES_API, {
      data: JSON.stringify(machinesArray),
      headers: {
        "Content-Type": "application/json",
      },
    });
    await refreshData(ROUTES.ALL_MACHINES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al eliminar equipos. Por favor intente de nuevo.",
    };
  }
}

export async function receiveEquipment(machineId, arrived = true, warehouseId = null) {
  try {
    const res = await axios.post(
      ROUTES.RECEIVE_EQUIPMENT_API,
      JSON.stringify({ machineId, arrived, warehouseId }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    await refreshData(ROUTES.COLLECTED_MACHINES_API);
    await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=ALMACENADA");
    await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?status=EN_VEHICULO");
    await refreshData(ROUTES.ALL_WAREHOUSE_MACHINES_API+"?summary=true");
    return { error: false, msg: res.data.message };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al recibir el equipo. Por favor intente de nuevo.",
    };
  }
}

export async function loadMachineToVehicle({ machineId }) {
  try {
    const res = await axios.post(
      ROUTES.LOAD_MACHINE_TO_VEHICLE_API,
      JSON.stringify({ machineId }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    await refreshData(ROUTES.READY_MACHINES_OPERATOR_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al subir el equipo al vehículo. Por favor intente de nuevo.",
    };
  }
}

export async function returnMachineToWarehouse({ machineId, warehouseId }) {
  try {
    const res = await axios.post(
      ROUTES.RETURN_MACHINE_TO_WAREHOUSE_API,
      JSON.stringify({ machineId, warehouseId }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    await refreshData(ROUTES.READY_MACHINES_OPERATOR_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al regresar el equipo al almacén. Por favor intente de nuevo.",
    };
  }
}

export async function convertMachineToSale(formData) {
  try {
    const res = await fetch(ROUTES.CONVERT_MACHINE_TO_SALE_API, {
      method: 'POST',
      body: formData
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: true, msg: json.errorMsg };
    }

    await refreshData(ROUTES.ALL_MACHINES_API);
    return { error: false, msg: json.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg: "Error al convertir el equipo a venta. Por favor intente de nuevo."
    };
  }
}
