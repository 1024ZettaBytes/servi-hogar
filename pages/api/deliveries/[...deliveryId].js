import {
    getDeliveryData
  } from "../../../lib/data/Deliveries";
  import {validateUserPermissions, getUserId} from "../auth/authUtils";
  async function getDeliveryByIdAPI(req, res) {
    const { deliveryId } = req.query;
    try {
      const delivery = await getDeliveryData(deliveryId);
      res.status(200).json( { data: delivery || {} });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({
          errorMsg:
            "Hubo un problema al consultar los datos de la entrega. Por favor intente de nuevo.",
        });
    }
  }


async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if(validRole)
    switch (req.method) {
      case "GET":
        await getDeliveryByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        break;
      case "DELETE":
        return;
    }
  }
  
  export default handler;