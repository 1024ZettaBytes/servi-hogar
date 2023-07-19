import {
  getSummaryByDay,
  getSummaryByRange,
  getProfitsReport,
} from "../../../lib/data/Reports";
import { validateUserPermissions } from "../auth/authUtils";
async function getSummaryAPI(req, res) {
  try {
    const { filter, start, end } = req.query;
    let data = {};
    switch (filter) {
      case "day":
        data = await getSummaryByDay(start);
        res.status(200).json({ data });
        break;
      case "range":
        data = await getSummaryByRange(start, end);
        res.status(200).json({ data });
        break;

      case "profits": {
        if(await validateUserPermissions(req, res, ["ADMIN"])){
        data = await getProfitsReport(start);
        res.status(200).json({ data });
        }
        return;
      }
    }
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
