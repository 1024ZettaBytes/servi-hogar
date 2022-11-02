import { validateUserPermissions, getUserId } from "../../auth/authUtils";
import {
  getPendingPickupsData,
  markCompletePickupData
} from "../../../../lib/data/Pickups";

async function getPendingPickupsAPI(req, res) {
  try {
    const rents = await getPendingPickupsData();
    res.status(200).json({ data: rents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completePickupAPI(req, res, userId) {
  try {
    await markCompletePickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "La recolección ha sido completada." });
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
        await getPendingPickupsAPI(req, res);
        break;
      case "POST":
        await completePickupAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
