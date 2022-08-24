import { getMachinesData } from "../../../lib/data/Machines";
import {validateUserPermissions, getUserId} from "../auth/authUtils";

async function getMachinesAPI(req, res) {
  try {
    const allMachines = await getMachinesData();
    res.status(200).json({ data: allMachines });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los equipos. Por favor intente de nuevo.",
    });
  }
}

async function saveMachineAPI(req, res, userId) {
  try {
    await saveCustomerData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "Equipo guardado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getMachinesAPI(req, res);
        break;
      case "POST":
        await saveMachineAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
    }
}

export default handler;
