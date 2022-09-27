import {CustomerLevel} from "../../../lib/models/CustomerLevel";
import {validateUserPermissions, getUserId} from "../auth/authUtils";
import {
  getCustomersData,
} from "../../../lib/data/Customers";
async function getCustomersForRentAPI( req, res ) {
  try {
    const allCustomers = await getCustomersData(true);
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

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if(validRole)
  switch (req.method) {
    case "GET":
      await getCustomersForRentAPI(req, res);
      break;
    case "POST":
      break;
    case "PUT":
      break;
    case "DELETE":
        break;
  }
}

export default handler;
