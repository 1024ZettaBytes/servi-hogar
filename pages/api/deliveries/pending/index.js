import { validateUserPermissions } from "../../auth/authUtils";
import {
  getPendingDeliveriesData,
} from "../../../../lib/data/Deliveries";
import formidable from "formidable";
export const config = {
  api: {
    bodyParser: false,
  },
};
async function getPendingDeliveriesAPI(req, res) {
  try {
    const rents = await getPendingDeliveriesData();
    res.status(200).json({ data: rents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getPendingDeliveriesAPI(req, res);
        break;
      case "POST":
        {
          const form = new formidable.IncomingForm();
          await form.parse(req, async function (err, fields, files) {
            console.log(err);
            console.log("--fileds:", JSON.parse(fields?.body));
            //console.log("--files:", files.file);
            res.status(200).json({ msg: "ok" });
          });
        }
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
