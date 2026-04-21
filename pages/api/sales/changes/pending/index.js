import { validateUserPermissions, getUserId, getUserRole } from '../../../auth/authUtils';
import {
  getPendingSaleChangesData,
  markCompleteSaleChangeData
} from '../../../../../lib/data/SaleChanges';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

async function getPendingSaleChangesAPI(req, res, userId, userRole) {
  try {
    const changes = await getPendingSaleChangesData(userId, userRole);
    res.status(200).json({ data: changes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completeSaleChangeAPI(req, res, userId) {
  try {
    const form = new formidable.IncomingForm();
    form.multiples = true;

    const { fields, files } = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          console.error(err);
          reject(
            new Error('Ocurrió un error interno, por favor contacte al administrador.')
          );
          return;
        }
        resolve({ fields, files });
      });
    });

    const body = JSON.parse(fields?.body);
    await markCompleteSaleChangeData({ ...body, files, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'El cambio por garantía ha sido completado.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getPendingSaleChangesAPI(req, res, userId, userRole);
        break;
      case 'POST':
        await completeSaleChangeAPI(req, res, userId);
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
}

export default handler;
