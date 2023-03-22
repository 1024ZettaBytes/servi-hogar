import { validateUserPermissions, getUserId } from "../auth/authUtils";
import {
  saveRentData,
  getRentsData,
  getPastRentsData,
} from "../../../lib/data/Rents";

async function saveRentAPI(req, res, userId) {
  try {
    const newRent = await saveRentData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "¡Renta guardada con éxito!", ...newRent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function getRentsAPI(req, res) {
  try {
    const { filter } = req.query;
    const rents =
      filter === "current" ? await getRentsData() : await getPastRentsData();
    res.status(200).json({ data: rents });
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
        await getRentsAPI(req, res);
        break;
      case "POST":
        await saveRentAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
