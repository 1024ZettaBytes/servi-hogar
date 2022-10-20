import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { getPendingDeliveriesData, updateDeliveryTimeData  } from "../../../lib/data/Deliveries";

async function getPendingDeliveriesAPI(req, res) {
  try{
   const rents = await getPendingDeliveriesData();
   res.status(200).json({ data: rents });
  }catch(e){
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function updateDeliveryTimeAPI(req, res, userId) {
  try{
   await updateDeliveryTimeData({...req.body , lastUpdatedBy: userId});
   res.status(200).json({ msg:"¡Horario de entrega actualizado con éxito!"});
  }catch(e){
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
        await getPendingDeliveriesAPI(req, res);
        break;
      case "POST":
        break;
      case "PUT":
        await updateDeliveryTimeAPI(req, res, userId);
        break;
      case "DELETE":
        break;
    }
}

export default handler;
