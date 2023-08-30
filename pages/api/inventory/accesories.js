import { getAllAccesories } from "../../../lib/data/Accesories";
import { validateUserPermissions } from "../auth/authUtils";

async function getAccesoriesAPI(req, res) {
  try {
    const allAccesories = await getAllAccesories();

    res.status(200).json({ data: allAccesories });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los accesorios. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getAccesoriesAPI(req, res);
        break;
      case "POST":
        break;
      case "PUT":
        break;
      case "DELETE":
    }
}

export default handler;
