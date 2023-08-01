import { getOperatorsReportData } from "../../../lib/data/Reports";
import { validateUserPermissions } from "../auth/authUtils";

async function getOperatorsReportAPI(req, res) {
  try {
   const operators = await getOperatorsReportData("2023-07-31");
    res.status(200).json({ data: operators });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al obtener la lista de operadores. Por favor intente de nuevo.",
    });
  }
}


async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  switch (req.method) {
    case "GET":
      validRole ? await getOperatorsReportAPI(req, res) : res.status(403).json({ errorMsg: "No tienes los permisos necesarios para realizar esta acción." });
      break;
    case "POST":
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
