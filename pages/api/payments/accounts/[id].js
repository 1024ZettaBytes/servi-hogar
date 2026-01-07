import { validateUserPermissions } from "../../auth/authUtils";
import { deletePaymentAccountData } from "../../../../lib/data/PaymentAccounts";

async function deletePaymentAccountAPI(req, res) {
  try {
    const { id } = req.query;
    await deletePaymentAccountData(id);
    res.status(200).json({ msg: "¡Cuenta eliminada con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN"]);
  if (validRole)
    switch (req.method) {
      case "DELETE":
        await deletePaymentAccountAPI(req, res);
        break;
      default:
        res.status(405).json({ errorMsg: "Método no permitido" });
        break;
    }
}

export default handler;
