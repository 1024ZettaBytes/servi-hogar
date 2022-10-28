import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { savePaymentData } from "../../../lib/data/Payments";
import formidable from "formidable";
export const config = {
  api: {
    bodyParser: false,
  },
};
async function savePaymentAPI(req, res, userId) {
  try {
    const form = new formidable.IncomingForm();
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
    await savePaymentData({
      ...body,
      files: Object.keys(files).length > 0 ? files : null,
      lastUpdatedBy: userId,
    });
    res.status(200).json({ msg: "¡Pago guardado con éxito!"});
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        break;
      case "POST":
        await savePaymentAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
