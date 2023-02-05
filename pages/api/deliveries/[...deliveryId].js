import {
  getDeliveryData,
  setDeliverySentData,
} from "../../../lib/data/Deliveries";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
async function getDeliveryByIdAPI(req, res) {
  const { deliveryId } = req.query;
  try {
    const delivery = await getDeliveryData(deliveryId);
    res.status(200).json({ data: delivery || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los datos de la entrega. Por favor intente de nuevo.",
    });
  }
}
async function setDeliverySentAPI(req, res, userId) {
  try {
    const { deliveryId } = req.query;
    await setDeliverySentData({
      ...req.body,
      deliveryId,
      lastUpdatedBy: userId,
    });
    res.status(200).json({ msg: "La entrega ha sido marcada como 'Enviada'" });
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
        await getDeliveryByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        await setDeliverySentAPI(req, res, userId);
        break;
      case "DELETE":
        return;
    }
}

export default handler;
