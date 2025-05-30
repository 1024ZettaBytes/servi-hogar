import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { getMantData } from "../../../lib/data/Mantainances";

async function getMantAPI(req, res, userId) {
  try {
    const mants = await getMantData(userId);
    res.status(200).json({ data: mants });
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
        await getMantAPI(req, res, userId);
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
