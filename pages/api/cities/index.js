import {
  getCitiesData,
} from "../../../lib/data/Cities";
async function getCitiesAPI(req, res) {
  try {
    const allCities = await getCitiesData();
    res.status(200).json({ data: allCities });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({
        errorMsg:
          "Hubo un problema al obtener las ciudades. Por favor intente de nuevo.",
      });
  }
}
async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await getCitiesAPI(req, res);
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
