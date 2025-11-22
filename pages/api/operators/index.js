import { getOperatorsData, asignOperatorData, recordAuxActionAndCheckBlocking } from "../../../lib/data/Users";
import { validateUserPermissions, getUserId, getUserRole } from "../auth/authUtils";

async function getOperatorsAPI(req, res) {
  try {
   const operators = await getOperatorsData();
    res.status(200).json({ data: operators });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al obtener la lista de operadores. Por favor intente de nuevo.",
    });
  }
}

async function asignOperator(req, res, userId, userRole) {
  try {
    await asignOperatorData({
      ...req.body,
      lastUpdatedBy: userId,
    });
    
    // If AUX user, record action and check blocking
    let wasBlocked = false;
    if (userRole === 'AUX') {
      wasBlocked = await recordAuxActionAndCheckBlocking(userId);
    }
    
    res.status(200).json({ msg: "La entrega ha sido marcada como 'Enviada'", wasBlocked });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  switch (req.method) {
    case "GET":
      await getOperatorsAPI(req, res);
      break;
    case "POST":
      validRole ?
      await asignOperator(req, res, userId, userRole)
      : res.status(403).json({ errorMsg: "No tienes los permisos necesarios para realizar esta acción." });
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
