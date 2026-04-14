import { returnMachineToWarehouseByOperator } from "../../../lib/data/Machines";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function returnToWarehouseAPI(req, res, userId) {
  try {
    const { machineId, warehouseId } = req.body;
    if (!machineId) {
      return res
        .status(400)
        .json({ errorMsg: "Falta el ID del equipo (machineId)" });
    }
    if (!warehouseId) {
      return res
        .status(400)
        .json({ errorMsg: "Falta el ID del almacén (warehouseId)" });
    }
    await returnMachineToWarehouseByOperator({
      machineId,
      warehouseId,
      operatorId: userId,
    });
    res.status(200).json({ msg: "Equipo regresado al almacén con éxito" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "Internal"
          ? e.message
          : "Hubo un problema al regresar el equipo. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["OPE"]);
  if (!validRole) return;
  const userId = await getUserId(req);
  switch (req.method) {
    case "POST":
      await returnToWarehouseAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
  }
}

export default handler;
