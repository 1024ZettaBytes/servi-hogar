import { getMachinesReportData } from "../../../../lib/data/Machines";
import { validateUserPermissions } from "../../auth/authUtils";

async function getMachineStatusAPI(req, res) {
  try {
    const machinesReport = await getMachinesReportData();
    res.status(200).json({ data: machinesReport });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar el reporte los equipos. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getMachineStatusAPI(req, res);
        break;
      case "POST":
        break;
      case "PUT":
        break;
      case "DELETE":
    }
}

export default handler;
