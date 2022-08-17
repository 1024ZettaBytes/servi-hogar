import { Customer } from "../../../lib/models/Customer";
import {CustomerLevel} from "../../../lib/models/CustomerLevel";
import {validateUserPermissions, getUserId} from "../auth/authUtils";
import {
  getCustomersData,
  saveCustomerData,
  updateCustomerData,
  deleteCustomersData
} from "../../../lib/data/Customers";
async function getCustomersAPI( req, res, next ) {
  try {
    
    const allCustomers = await getCustomersData();
    res.status(200).json({ data: allCustomers });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({
        errorMsg:
          "Hubo un problema al consultar los clientes. Por favor intente de nuevo.",
      });
  }
}
async function saveCustomerAPI(req, res, userId) {
  try {
    const givenLevel = await CustomerLevel.findOne({ id: "nuevo" });
    await saveCustomerData({...req.body, level:givenLevel._id, lastUpdatedBy: userId});
    res.status(200).json({ msg: "¡Cliente guardado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function updateCustomerAPI(req, res,userId, userRole){
  try {
    await updateCustomerData({...req.body , lastUpdatedBy: userId}, userRole);
    res.status(200).json({ msg: "¡Cliente actualizado con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function deleteCustomersAPI(req, res,userId, userRole){
  try {
    if(userRole!=="ADMIN")
    res.status(403).json({ errorMsg: "No tienes permisos para realizar esta acción" });
    await deleteCustomersData({arrayOfIds:req.body , lastUpdatedBy: userId});
    res.status(200).json({ msg: "¡Cliente(s) eliminados con éxito!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  if(validRole)
  switch (req.method) {
    case "GET":
      await getCustomersAPI(req, res);
      break;
    case "POST":
      await saveCustomerAPI(req, res, userId);
      break;
    case "PUT":
      await updateCustomerAPI(req, res,userId, validRole);
      break;
    case "DELETE":
      await deleteCustomersAPI(req, res,userId, validRole)
  }
}

export default handler;
