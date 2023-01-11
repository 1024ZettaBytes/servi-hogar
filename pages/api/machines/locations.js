import { validateUserPermissions } from "../auth/authUtils";
import { getRentsWithLocations } from "../../../lib/data/Rents";

async function getMachinesLocationsAPI(req, res) {
  try {
    const allRentsWithLocations = await getRentsWithLocations();
    res.status(200).json({ data: allRentsWithLocations });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al obtener ubicaciones. Por favor intente de nuevo.",
    });
  }
}
async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getMachinesLocationsAPI(req, res);
        break;
      case "POST":
        return;
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
