import { validateUserPermissions, getUserId } from "../../auth/authUtils";
import { getMachinesWithoutMaintenance } from "../../../../lib/data/Mantainances";

async function getMachinesAlertAPI(req, res, userId) {
  try {
    const alert = await getMachinesWithoutMaintenance();
    res.status(200).json({ data: alert });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
    switch (req.method) {
      case "GET":
        await validateUserPermissions(req, res, ["ADMIN", "AUX", "TEC"]);
        await getMachinesAlertAPI(req, res, userId);
        break;
      case "POST":
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
