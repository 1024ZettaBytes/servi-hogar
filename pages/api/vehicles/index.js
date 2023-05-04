import { getVehiclesData } from "../../../lib/data/Vehicles";
import { validateUserPermissions } from "../auth/authUtils";

async function getVehiclesAPI(req, res) {
  try {
    const allVehicles = await getVehiclesData();
    res.status(200).json({ data: allVehicles });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los vehiculos. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getVehiclesAPI(req, res);
        break;
      case "POST":
        break;
      case "PUT":
        break;
      case "DELETE":
    }
}

export default handler;
