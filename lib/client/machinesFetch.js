import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";
export async function saveMachine(machineData) {
  try {
    const res = await axios.post(
      ROUTES.ALL_MACHINES_API,
      JSON.stringify(machineData),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    refreshData(ROUTES.ALL_MACHINES_API);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        "Error al guardar el equipo. Por favor intente de nuevo.",
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
