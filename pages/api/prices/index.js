import {
    getPricesData,
    updateVueltaPriceData
  } from "../../../lib/data/Prices";
  import { validateUserPermissions, getUserId } from "../auth/authUtils";

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

  async function updateVueltaPriceAPI(req, res, userId) {
    try {
      const { vueltaPrice } = req.body;
      const updated = await updateVueltaPriceData({
        vueltaPrice: Number(vueltaPrice),
        lastUpdatedBy: userId
      });
      res.status(200).json({ msg: "Precio por vuelta actualizado.", data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }

  async function handler(req, res) {
    switch (req.method) {
      case "GET":
        await getPricesAPI(req, res);
        break;
      case "PUT": {
        const canManage = await validateUserPermissions(req, res, ["ADMIN"]);
        if (!canManage) return;
        const userId = await getUserId(req);
        await updateVueltaPriceAPI(req, res, userId);
        break;
      }
      default:
        res.status(405).json({ errorMsg: "Método no permitido" });
        break;
    }
  }

  export default handler;
