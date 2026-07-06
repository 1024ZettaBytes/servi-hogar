import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { applyRentalReplacementData } from "../../../lib/data/WarehouseMachines";

async function applyRentalReplacementAPI(req, res, userId) {
  try {
    const { warehouseMachineId, machineToReplaceId } = req.body;

    if (!warehouseMachineId || !machineToReplaceId) {
      return res.status(400).json({
        errorMsg: "Se requieren warehouseMachineId y machineToReplaceId"
      });
    }

    const result = await applyRentalReplacementData({
      warehouseMachineId,
      machineToReplaceId,
      lastUpdatedBy: userId
    });

    res.status(200).json({
      msg: `Reemplazo aplicado. El equipo #${result.newMachine.machineNum} quedó como equipo de renta.`,
      data: result
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN"]);
  if (!validRole) return;

  const userId = await getUserId(req);
  switch (req.method) {
    case "POST":
      await applyRentalReplacementAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
      break;
  }
}

export default handler;
