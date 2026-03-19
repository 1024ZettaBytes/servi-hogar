import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { moveToSaleData } from "../../../lib/data/WarehouseMachines";

async function moveToSaleAPI(req, res, userId) {
  try {
    const { warehouseMachineId } = req.body;
    const result = await moveToSaleData({
      warehouseMachineId,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: "La máquina ha sido pasada a venta.", data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userId = await getUserId(req);
  switch (req.method) {
    case "POST":
      await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
      await moveToSaleAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
      break;
  }
}

export default handler;
