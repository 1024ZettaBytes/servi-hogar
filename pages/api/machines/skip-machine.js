import { skipMachineByOperator } from "../../../lib/data/Machines";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function skipMachineAPI(req, res, userId) {
  try {
    const { machineId, reason } = req.body;
    if (!machineId) {
      return res
        .status(400)
        .json({ errorMsg: "Falta el ID del equipo (machineId)" });
    }
    if (!reason || reason.trim() === "") {
      return res
        .status(400)
        .json({ errorMsg: "Debe especificar el motivo por el que no se lleva el equipo" });
    }
    await skipMachineByOperator({ machineId, operatorId: userId, reason });
    res.status(200).json({ msg: "Equipo reportado y enviado a revisión con éxito" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "Internal"
          ? e.message
          : "Hubo un problema al reportar el equipo. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["OPE", "ADMIN", "AUX"]);
  if (!validRole) return;
  const userId = await getUserId(req);
  switch (req.method) {
    case "POST":
      await skipMachineAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
  }
}

export default handler;
