import { getMachinesForRentData } from "../../../lib/data/Machines";
import { validateUserPermissions } from "../auth/authUtils";

async function getMachinesForRentAPI(req, res) {
  try {
    const machinesForRent = await getMachinesForRentData();
    res.status(200).json({ data: machinesForRent });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los equipos. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, [
    "ADMIN",
    "AUX",
    "OPE",
  ]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getMachinesForRentAPI(req, res);
        break;
      case "POST":
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
