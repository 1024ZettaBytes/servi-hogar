import {
    getPricesData
  } from "../../../lib/data/Prices";
  async function getPricesAPI(req, res) {
    try {
      const allPrices = await getPricesData();
      res.status(200).json({ data: allPrices });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({
          errorMsg:
            "Hubo un problema al obtener los precios. Por favor intente de nuevo.",
        });
    }
  }
  async function handler(req, res) {
    switch (req.method) {
      case "GET":
        await getPricesAPI(req, res);
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
  