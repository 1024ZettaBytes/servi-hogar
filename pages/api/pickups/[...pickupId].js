import { getPickupData, setPickupSentData } from "../../../lib/data/Pickups";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
async function getPickupByIdAPI(req, res) {
  const { pickupId } = req.query;
  try {
    const pickup = await getPickupData(pickupId);
    res.status(200).json({ data: pickup || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los datos de la recolección. Por favor intente de nuevo.",
    });
  }
}
async function setPickupSentAPI(req, res, userId) {
  try {
    const { pickupId } = req.query;
    await setPickupSentData({
      ...req.body,
      pickupId,
      lastUpdatedBy: userId,
    });
    res
      .status(200)
      .json({ msg: "La recolección ha sido marcada como 'Enviada'" });
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
        await getPickupByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        await setPickupSentAPI(req, res, userId);
        break;
      case "DELETE":
        return;
    }
}

export default handler;
