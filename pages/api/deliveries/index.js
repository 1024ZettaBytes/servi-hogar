import { validateUserPermissions, getUserId } from "../auth/authUtils";
import {
  updateDeliveryTimeData,
  cancelDeliveryData,
} from "../../../lib/data/Deliveries";

async function updateDeliveryTimeAPI(req, res, userId) {
  try {
    await updateDeliveryTimeData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "¡Horario de entrega actualizado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelDeliveryAPI(req, res, userId) {
  try {
    await cancelDeliveryData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "Entrega cancelada" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        break;
      case "POST":
        break;
      case "PUT":
        await updateDeliveryTimeAPI(req, res, userId);
        break;
      case "DELETE":
        await cancelDeliveryAPI(req, res, userId);
        break;
    }
}

export default handler;
