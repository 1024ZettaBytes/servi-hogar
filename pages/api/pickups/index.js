import {
  getPastPickupsData,
  savePickupData,
  updatePickupTimeData,
  cancelPickupData,
} from "../../../lib/data/Pickups";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function getPickupsAPI(req, res) {
  try {
    const rents = await getPastPickupsData();
    res.status(200).json({ data: rents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function savePickupAPI(req, res, userId) {
  try {
    const newPickup = await savePickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "¡Recolección creada!", pickup: newPickup });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function updatePickupTimeAPI(req, res, userId) {
  try {
    await updatePickupTimeData({ ...req.body, lastUpdatedBy: userId });
    res
      .status(200)
      .json({ msg: "¡Horario de recolección actualizado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelPickupAPI(req, res, userId) {
  try {
    await cancelPickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "Recolección cancelada" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getPickupsAPI(req, res);
        break;
      case "POST":
        await savePickupAPI(req, res, userId);
        return;
      case "PUT":
        await updatePickupTimeAPI(req, res, userId);
        break;
      case "DELETE":
        await cancelPickupAPI(req, res, userId);
        return;
    }
}

export default handler;
