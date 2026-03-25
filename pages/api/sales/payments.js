import { validateUserPermissions } from "../auth/authUtils";
import { getSalePaymentsData } from "../../../lib/data/Sales";

async function getSalePaymentsAPI(req, res) {
  try {
    const { page, limit, searchTerm } = req.query;
    const payments = await getSalePaymentsData(page, limit, searchTerm);
    res.status(200).json({ data: payments });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los pagos de venta. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (validRole) {
    switch (req.method) {
      case "GET":
        await getSalePaymentsAPI(req, res);
        break;
      default:
        res.status(405).json({ errorMsg: "Método no permitido" });
        break;
    }
  }
}

export default handler;
