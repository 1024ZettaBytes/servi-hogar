import { validateUserPermissions, getUserId } from "../../auth/authUtils";
import {
  getPendingChangesData,
  markCompleteChangeData
} from "../../../../lib/data/Changes";

async function getPendingChangesAPI(req, res) {
  try {
    const rents = await getPendingChangesData();
    res.status(200).json({ data: rents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completeChangeAPI(req, res, userId) {
  try {
    await markCompleteChangeData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "El cambio ha sido completado." });
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
        await getPendingChangesAPI(req, res);
        break;
      case "POST":
        await completeChangeAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
