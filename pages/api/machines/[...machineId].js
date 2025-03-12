import {
  getMachineByIdData,
  updateMachineData
} from '../../../lib/data/Machines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';
export const config = {
  api: {
    bodyParser: false
  }
};

async function getMachineByIdAPI(req, res) {
  const { machineId } = req.query;

  try {
    const machine = await getMachineByIdData(machineId);
    res.status(200).json({ data: machine || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los datos del equipo. Por favor intente de nuevo.'
    });
  }
}

async function updateMachineAPI(req, res, userId) {
  try {
    const form = new formidable.IncomingForm();
    form.multiples = true;

    const { fields, files } = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
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
    const body = JSON.parse(fields?.body);
    await updateMachineData({ ...body, files, lastUpdatedBy: userId });
    res.status(200).json({ msg: '¡Equipo actualizado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}
async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, [
    'ADMIN',
    'AUX',
    'OPE'
  ]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getMachineByIdAPI(req, res);
        break;
      case 'POST':
        return;
        break;
      case 'PUT':
        await updateMachineAPI(req, res, userId);
        break;
      case 'DELETE':
        return;
        break;
    }
}

export default handler;
