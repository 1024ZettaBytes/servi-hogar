import { getChangeData, setChangeSentData } from "../../../lib/data/Changes";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
async function getChangeByIdAPI(req, res) {
  const { changeId } = req.query;
  try {
    const change = await getChangeData(changeId);
    res.status(200).json({ data: change || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los datos del cambio. Por favor intente de nuevo.",
    });
  }
}

async function setChangeSentAPI(req, res, userId) {
  try {
    const { changeId } = req.query;
    await setChangeSentData({ ...req.body, changeId, lastUpdatedBy: userId });
    res.status(200).json({ msg: "El cambio ha sido marcada como 'Enviado'" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getChangeByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        await setChangeSentAPI(req, res, userId);
        break;
      case "DELETE":
        return;
    }
}

export default handler;
