import { validateUserPermissions, getUserId } from "../auth/authUtils";
import {
  getCustomersData,
  updateCustomerResidenceData,
} from "../../../lib/data/Customers";
import {saveRentData} from "../../../lib/data/Rents";
async function getCustomersForRentAPI(req, res) {
  try {
    const allCustomers = await getCustomersData(true);
    res.status(200).json({ data: allCustomers });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los clientes. Por favor intente de nuevo.",
    });
  }
}

async function updateCustomerAPI(req, res, userId, userRole) {
  try {
    await updateCustomerResidenceData(
      { ...req.body, lastUpdatedBy: userId },
      userRole
    );
    res.status(200).json({ msg: "¡Domicilio actualizado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function saveRentAPI(req, res, userId, userRole) {
  try{
   await saveRentData();
   res.status(200).json({ msg: "¡Renta guardada con éxito!" });
  }catch(e){
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
        await getCustomersForRentAPI(req, res);
        break;
      case "POST":
        await saveRentAPI(req, res, userId, validRole);
        break;
      case "PUT":
        await updateCustomerAPI(req, res, userId, validRole);
        break;
      case "DELETE":
        break;
    }
}

export default handler;
