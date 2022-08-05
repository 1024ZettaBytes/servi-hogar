import { Customer } from "../../../lib/models/Customer";
import {CustomerLevel} from "../../../lib/models/CustomerLevel";
import {
  getCustomersData,
  saveCustomerData,
} from "../../../lib/data/Customers";
async function getCustomersAPI(req, res) {
  try {
    const allCustomers = await getCustomersData();
    res.status(200).json({ data: allCustomers });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({
        errorMsg:
          "Hubo un problema al consultar los clientes. Por favor intente de nuevo.",
      });
  }
}
async function saveCustomerAPI(req, res) {
  try {
    const givenLevel = await CustomerLevel.findOne({ id: "nuevo" });
    await saveCustomerData({...req.body, level:givenLevel._id});
    res.status(200).json({ msg: "¡Cliente guardado con éxito!" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await getCustomersAPI(req, res);
      break;
    case "POST":
      await saveCustomerAPI(req, res);
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
