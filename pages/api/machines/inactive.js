import { validateUserPermissions } from "../auth/authUtils";
import { getInactiveRentalMachinesData } from "../../../lib/data/WarehouseMachines";

async function getInactiveMachinesAPI(req, res) {
  try {
    const machines = await getInactiveRentalMachinesData();
    res.status(200).json({ data: machines });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (!validRole) return;
  
  switch (req.method) {
    case "GET":
      await getInactiveMachinesAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
      break;
  }
}

export default handler;
