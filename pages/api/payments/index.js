import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { savePaymentData, getPaymentsData } from "../../../lib/data/Payments";
import formidable from "formidable";
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getPaymentsAPI(req, res){
  try {
    const { page, limit, searchTerm } = req.query;
    const payments = await getPaymentsData(page, limit, searchTerm);
    res.status(200).json({ data: payments });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({
        errorMsg:
          "Hubo un problema al consultar los pagos. Por favor intente de nuevo.",
      });
  }
  
}
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
    const result = await savePaymentData({
      ...body,
      files: Object.keys(files).length > 0 ? files : null,
      lastUpdatedBy: userId,
    });
    res.status(200).json({ 
      msg: "¡Pago guardado con éxito!", 
      receipt: result
    });
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
        await getPaymentsAPI(req, res);
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
