import {
  getMachinesDataWithDetails,
  saveMachineData,
  deleteMachinesData,
} from "../../../lib/data/Machines";
import { validateUserPermissions, getUserId } from "../auth/authUtils";
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getMachinesAPI(req, res) {
  try {
    const allMachines = await getMachinesDataWithDetails();
    res.status(200).json({ data: allMachines });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Hubo un problema al consultar los equipos. Por favor intente de nuevo.",
    });
  }
}

async function saveMachineAPI(req, res, userId) {
  try {
    const form = new formidable.IncomingForm();
    form.multiples = true;

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error(err);
          reject(
            new Error(
              'Ocurrió un error interno, por favor contacte al administrador.'
            )
          );
          return;
        }
        resolve({ fields, files });
      });
    });

    await saveMachineData({
      brand: fields.brand,
      cost: fields.cost,
      status: fields.status,
      location: fields.location || null,
      partner: fields.partner || null,
      files,
      lastUpdatedBy: userId,
    });

    res.status(200).json({ msg: "Equipo guardado con éxito!" });

  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function deleteMachinesAPI(req, res, userId, userRole) {
  try {
    if (userRole !== "ADMIN")
      res
        .status(403)
        .json({ errorMsg: "No tienes permisos para realizar esta acción" });
    await deleteMachinesData({ arrayOfIds: req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: "¡Equipo(s) eliminados con éxito!" });
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
        await getMachinesAPI(req, res);
        break;
      case "POST":
        await saveMachineAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        await deleteMachinesAPI(req, res, userId, validRole);
    }
}

export default handler;
