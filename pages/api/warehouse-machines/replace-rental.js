import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { replaceRentalMachineData } from "../../../lib/data/WarehouseMachines";

async function replaceRentalAPI(req, res, userId) {
  try {
    const { warehouseMachineId, machineToReplaceId, warehouseId } = req.body;
    
    if (!warehouseMachineId || !machineToReplaceId || !warehouseId) {
      return res.status(400).json({ 
        errorMsg: "Se requieren warehouseMachineId, machineToReplaceId y warehouseId" 
      });
    }

    const result = await replaceRentalMachineData({
      warehouseMachineId,
      machineToReplaceId,
      warehouseId,
      lastUpdatedBy: userId
    });

    res.status(200).json({ 
      msg: `Se creó el equipo #${result.newMachine.machineNum} como reemplazo.`,
      data: result 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (!validRole) return;
  
  const userId = await getUserId(req);
  switch (req.method) {
    case "POST":
      await replaceRentalAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
      break;
  }
}

export default handler;
