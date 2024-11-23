import {CustomerLevel} from "../../../lib/models/CustomerLevel";
import {validateUserPermissions, getUserId} from "../auth/authUtils";
import {
  getCustomersData,
  saveCustomerData,
  deleteCustomersData
} from "../../../lib/data/Customers";
async function getCustomersAPI( req, res ) {
  try {
    const { noDetail } = req.query;
    const allCustomers = await getCustomersData(false, noDetail);
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
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
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
      return;
      break;
    case "DELETE":
      await deleteCustomersAPI(req, res,userId, validRole)
  }
}

export default handler;
