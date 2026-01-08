import {
  getSummaryByDay,
  getSummaryByRange,
  getProfitsReport,
  getProfitsByRange,
  getTechniciansReport
} from "../../../lib/data/Reports";
import { getUserRole, validateUserPermissions } from "../auth/authUtils";
async function getSummaryAPI(req, res) {
  try {
    const { filter, start, period } = req.query;
    let data = {};
    switch (filter) {
      case "day":
        data = await getSummaryByDay(start);
        res.status(200).json({ data });
        break;
      case "range":
        data = await getSummaryByRange(start, period);
        res.status(200).json({ data });
        break;

      case "profits": {
        if(await validateUserPermissions(req, res, ["ADMIN"])){
        data = await getProfitsReport(start);
        res.status(200).json({ data });
        }
        return;
      }
      case "profits-range": {
        if(await validateUserPermissions(req, res, ["ADMIN"])){
        data = await getProfitsByRange(start, end);
        res.status(200).json({ data });
        }
        return;
      }
      case "technicians": {
        if(await validateUserPermissions(req, res, ["ADMIN", "AUX", "TEC"])){
          const userRole = await getUserRole(req);
          data = await getTechniciansReport(start, end, userRole);
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
  const { filter } = req.query;
  const validRole = await validateUserPermissions(req, res, filter === "profits" ? ["ADMIN"] : ["ADMIN", "AUX", "OPE", "SUB" , "TEC"]);
  if(validRole)
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
