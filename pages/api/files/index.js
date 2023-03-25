import { validateUserPermissions } from "../auth/authUtils";

import formidable from "formidable";
import { updateFilesData } from "../../../lib/data/Files";
export const config = {
  api: {
    bodyParser: false,
  },
};


async function updateFilesAPI(req, res) {
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
    
    await updateFilesData(body, files);
    res.status(200).json({ msg: "Archivos actualizados" });
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
        break;
      case "POST":
        await updateFilesAPI(req, res);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
