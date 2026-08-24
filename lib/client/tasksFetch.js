import axios from "axios";
import { mutate } from "swr";
import { ROUTES } from "../consts/API_URL_CONST";
import { refreshData } from "../../pages/api/useRequest";

export async function updateTaskScheduledTime(taskId, taskType, scheduledTime) {
  try {
    const URL = ROUTES.SCHEDULE_TASK_API;
    const res = await axios.post(URL, JSON.stringify({ taskId, taskType, scheduledTime }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    // La key de slots ahora lleva `operatorId`, así que se revalida por prefijo:
    // la agenda del operador y la vista de oficina (todas las agendas) a la vez.
    mutate(
      (key) =>
        typeof key === "string" && key.startsWith(ROUTES.SCHEDULED_SLOTS_API)
    );

    // Refresh pending actions to update the tables
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API);
    refreshData(`${ROUTES.ALL_PENDING_PICKUPS_API}?detailed=true`);
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    refreshData(ROUTES.ALL_PENDING_SALE_PICKUPS_API + '?detailed=true');
    refreshData(ROUTES.ALL_PENDING_COLLECTIONS_API);
    refreshData(ROUTES.ALL_EXTERNAL_REPAIRS_API);
    
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        err?.response?.data?.msg ||
        "Error al actualizar la hora programada. Por favor intente de nuevo.",
    };
  }
}
