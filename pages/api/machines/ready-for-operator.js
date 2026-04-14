import { getMachinesForOperator } from "../../../lib/data/Machines";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function getMachinesAPI(req, res, userId) {
  try {
    const data = await getMachinesForOperator(userId);
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "Internal"
          ? e.message
          : "Hubo un problema al consultar los equipos. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["OPE"]);
  if (!validRole) return;
  const userId = await getUserId(req);
  switch (req.method) {
    case "GET":
      await getMachinesAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
  }
}

export default handler;
