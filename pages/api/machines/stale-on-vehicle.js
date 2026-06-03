import { getStaleMachinesOnVehicles, unloadStaleMachineByTechnician } from "../../../lib/data/Machines";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function getStaleMachinesAPI(req, res) {
  try {
    const machines = await getStaleMachinesOnVehicles();
    res.status(200).json({ data: machines });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: "Hubo un problema al obtener los equipos sobrantes.",
    });
  }
}

async function unloadStaleMachineAPI(req, res, userId) {
  try {
    const { machineId } = req.body;
    if (!machineId) {
      return res
        .status(400)
        .json({ errorMsg: "Falta el ID del equipo (machineId)" });
    }
    await unloadStaleMachineByTechnician({
      machineId,
      technicianId: userId,
    });
    res.status(200).json({ msg: "Equipo bajado del vehículo con éxito" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "Internal"
          ? e.message
          : "Hubo un problema al bajar el equipo. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["TEC", "ADMIN", "AUX"]);
  if (!validRole) return;
  const userId = await getUserId(req);
  switch (req.method) {
    case "GET":
      await getStaleMachinesAPI(req, res);
      break;
    case "POST":
      await unloadStaleMachineAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
  }
}

export default handler;
