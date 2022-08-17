import {
    getCustomerByIdData,
  } from "../../../lib/data/Customers";

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
async function handler(req, res) {
    switch (req.method) {
      case "GET":
        await getCustomerByIdAPI(req, res);
        break;
      case "POST":
        return;
        break;
      case "PUT":
        return;
        break;
      case "DELETE":
        return;
        break;
    }
  }
  
  export default handler;