import {
  getCustomersLevelsData,
} from "../../../../lib/data/Customers";
async function getCustomersLevelsAPI(req, res) {
  try {
    const allCustomers = await getCustomersLevelsData();
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
async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await getCustomersLevelsAPI(req, res);
      break;
    case "POST":
      return;
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
