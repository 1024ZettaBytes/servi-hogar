import { getSummaryByDay, getSummaryByRange } from "../../../lib/data/Reports";
async function getSummaryAPI(req, res) {
  try {
    const { filter, start, end } = req.query;
    let data = {};
    switch (filter) {
      case "day":
        data = await getSummaryByDay(startDate);
        break;
      case "range": data = await getSummaryByRange(start, end); 
      break;
    }
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al obtener el reporte. Por favor intente de nuevo.",
    });
  }
}
async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await getSummaryAPI(req, res);
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
