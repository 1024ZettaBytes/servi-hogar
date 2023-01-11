import {
  getPastChangesData,
  saveChangeData,
  updateChangeTimeData,
  cancelChangeData,
} from "../../../lib/data/Changes";
import { validateUserPermissions, getUserId } from "../auth/authUtils";

async function getChangesAPI(req, res) {
  try {
    const rents = await getPastChangesData();
    res.status(200).json({ data: rents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function saveChangeAPI(req, res, userId) {
  try {
     const newChange = await saveChangeData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "¡Cambio creado!", change: newChange });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function updateChangeTimeAPI(req, res, userId) {
  try {
    await updateChangeTimeData({ ...req.body, lastUpdatedBy: userId });
    res
      .status(200)
      .json({ msg: "¡Horario de cambio actualizado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelChangeAPI(req, res, userId) {
  try {
    await cancelChangeData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "Cambio cancelado" });
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
        await getChangesAPI(req, res);
        break;
      case "POST":
        await saveChangeAPI(req, res, userId);
        return;
      case "PUT":
        await updateChangeTimeAPI(req, res, userId);
        break;
      case "DELETE":
        await cancelChangeAPI(req, res, userId);
        return;
    }
}

export default handler;
