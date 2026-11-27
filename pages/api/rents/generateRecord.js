import {
  generateCurrentRentLogData
} from "../../../lib/data/Rents";
import { generateRecordData } from "../../../lib/data/Records";
import { createPickupsForRents } from "../../../lib/data/Rents";
async function generateRecordAPI(req, res) {
  try {
    console.log("/generateRecord called at: ", new Date().toString());
    const { id } = req.query;
    if(id){
      await generateRecordData(id);
      return res.status(200).json({ data: { message: "OK" } });
    }
    // Idempotente: el cron llama varias veces por madrugada.
    // - El log de rentas sólo se crea la primera vez.
    // - createPickupsForRents sólo toma rentas RENTADO, y al programar la
    //   recolección pasan a EN_RECOLECCION, así que repetirlo no duplica nada.
    const rentsLog = await generateCurrentRentLogData();
    await createPickupsForRents();
    res.status(200).json({ data: { message: "OK", rentsLog } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await generateRecordAPI(req, res);
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
