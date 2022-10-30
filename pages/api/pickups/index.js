import { savePickupData } from "../../../lib/data/Pickups";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
async function savePickupAPI(req, res, userId) {
  try {
    //await savePickupData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "¡Recolección creada!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al crear la recolección. Por favor intente de nuevo.",
    });
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
        await savePickupAPI(req, res, userId);
        return;
      case "PUT":
        break;
      case "DELETE":
        return;
    }
}

export default handler;
