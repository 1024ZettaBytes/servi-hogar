import { validateUserPermissions, getUserId } from "../../auth/authUtils";
import {
  getPendingDeliveriesData,
  markCompleteDeliveryData,
} from "../../../../lib/data/Deliveries";
import formidable from "formidable";
export const config = {
  api: {
    bodyParser: false,
  },
};
async function getPendingDeliveriesAPI(req, res, userId) {
  try {
    const rents = await getPendingDeliveriesData(userId);
    res.status(200).json({ data: rents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completeDeliveryAPI(req, res, userId) {
  try {
    const form = new formidable.IncomingForm();
    form.multiples = true;

    const { fields, files } = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          console.error(err);
          reject(
            new Error(
              "Ocurrió un error interno, por favor contacte al administrador."
            )
          );
          return;
        }
        resolve({ fields, files });
      });
    });

    const body = JSON.parse(fields?.body);

    await markCompleteDeliveryData({ ...body, files, lastUpdatedBy: userId });
    res.status(200).json({ msg: "La entrega ha sido completada." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        await getPendingDeliveriesAPI(req, res, userId);
        break;
      case "POST":
        await completeDeliveryAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
