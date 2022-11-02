import {
  getChangeData
} from "../../../lib/data/Changes";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
async function getChangeByIdAPI(req, res) {
  const { changeId } = req.query;
  try {
    const change = await getChangeData(changeId);
    res.status(200).json({ data: change || {} });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({
        errorMsg:
          "Hubo un problema al consultar los datos del cambio. Por favor intente de nuevo.",
      });
  }
}


async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getChangeByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        break;
      case "DELETE":
        return;
    }
}

export default handler;