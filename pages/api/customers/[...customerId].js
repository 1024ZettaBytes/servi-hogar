import {
    getCustomerByIdData,
    updateCustomerData
  } from "../../../lib/data/Customers";
  import {validateUserPermissions, getUserId} from "../auth/authUtils";
  async function getCustomerByIdAPI(req, res) {
    const { customerId } = req.query;
    try {
      const customer = await getCustomerByIdData(customerId);
      
      res.status(200).json( { data: customer || {} });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({
          errorMsg:
            "Hubo un problema al consultar los datos del cliente. Por favor intente de nuevo.",
        });
    }
  }

  async function updateCustomerAPI(req, res,userId, userRole){
    try {
      await updateCustomerData({...req.body , lastUpdatedBy: userId}, userRole);
      res.status(200).json({ msg: "¡Cliente actualizado con éxito!" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
    switch (req.method) {
      case "GET":
        await getCustomerByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        await updateCustomerAPI(req, res,userId, validRole);
        break;
      case "DELETE":
        return;
    }
  }
  
  export default handler;