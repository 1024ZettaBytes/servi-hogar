import {
  saveRentData,
  getRentsData,
  getPastRentsData,
} from "../../../lib/data/Rents";

async function generateRecordAPI(req, res) {
  try {
    /*const rents =
      filter === "current" ? await getRentsData() : await getPastRentsData();*/
    const currentDate = new Date();
    console.log("/generateRecord called at: ", currentDate.toString());
    res.status(200).json({ data: { message: "OK" } });
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
