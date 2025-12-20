import axios from "axios";
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
    
    // Refresh the scheduled slots data
    if (scheduledTime) {
      const date = new Date(scheduledTime).toISOString().split('T')[0];
      refreshData(`${ROUTES.SCHEDULED_SLOTS_API}?date=${date}`);
    }
    
    // Refresh pending actions to update the tables
    refreshData(ROUTES.ALL_PENDING_DELIVERIES_API);
    refreshData(`${ROUTES.ALL_PENDING_PICKUPS_API}?detailed=true`);
    refreshData(ROUTES.ALL_PENDING_CHANGES_API);
    refreshData(`${ROUTES.ALL_PENDING_SALE_PICKUPS_API}?detailed=true`);
    refreshData(ROUTES.ALL_PENDING_COLLECTIONS_API);
    
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
