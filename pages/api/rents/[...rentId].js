import { getRentByIdData, changeRentPayDayData } from "../../../lib/data/Rents";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
async function getRentByIdAPI(req, res) {
  const { rentId } = req.query;
  try {
    const rentData = await getRentByIdData(rentId);
    res.status(200).json({ data: rentData || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los datos de la renta. Por favor intente de nuevo.",
    });
  }
}

async function changeRentPayDayAPI(req, res, userId) {
  const { rentId } = req.query;
  try {
    await changeRentPayDayData({ ...req.body, rentId, lastUpdatedBy: userId});
    res.status(200).json({ msg: "¡Se cambió el día de pago!"});
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al guardar el día de pago. Por favor intente de nuevo.",
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getRentByIdAPI(req, res);
        break;
      case "POST":
        return;
      case "PUT":
        await changeRentPayDayAPI(req, res, userId);
        break;
      case "DELETE":
        return;
    }
}

export default handler;
