import { getWarehousesOverviewData } from "../../../lib/data/Warehouses";
import { validateUserPermissions, getUserRole } from "../auth/authUtils";

async function getWarehousesOverviewAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    const allWarehousesOverview = await getWarehousesOverviewData(userRole);
    res.status(200).json({ data: allWarehousesOverview });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar las bodegas. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getWarehousesOverviewAPI(req, res);
        break;
      case "POST":
        break;
      case "PUT":
        break;
      case "DELETE":
    }
}

export default handler;
