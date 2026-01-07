import { validateUserPermissions, getUserId } from "../../auth/authUtils";
import { getPaymentAccountsData, savePaymentAccountData } from "../../../../lib/data/PaymentAccounts";

async function getPaymentAccountsAPI(req, res) {
  try {
    const accounts = await getPaymentAccountsData();
    res.status(200).json({ data: accounts });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar las cuentas. Por favor intente de nuevo.",
    });
  }
}

async function savePaymentAccountAPI(req, res, userId) {
  try {
    const body = req.body;
    await savePaymentAccountData({
      ...body,
      lastUpdatedBy: userId,
    });
    res.status(200).json({ msg: "¡Cuenta guardada con éxito!" });
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
        await getPaymentAccountsAPI(req, res);
        break;
      case "POST":
        await savePaymentAccountAPI(req, res, userId);
        break;
      default:
        res.status(405).json({ errorMsg: "Método no permitido" });
        break;
    }
}

export default handler;
