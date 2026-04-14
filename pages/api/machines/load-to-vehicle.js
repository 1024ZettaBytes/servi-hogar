import { loadMachineToVehicleByOperator } from "../../../lib/data/Machines";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function loadToVehicleAPI(req, res, userId) {
  try {
    const { machineId } = req.body;
    if (!machineId) {
      return res
        .status(400)
        .json({ errorMsg: "Falta el ID del equipo (machineId)" });
    }
    await loadMachineToVehicleByOperator({
      machineId,
      operatorId: userId,
    });
    res.status(200).json({ msg: "Equipo subido al vehículo con éxito" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "Internal"
          ? e.message
          : "Hubo un problema al subir el equipo. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["OPE"]);
  if (!validRole) return;
  const userId = await getUserId(req);
  switch (req.method) {
    case "POST":
      await loadToVehicleAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
  }
}

export default handler;
