import { validateUserPermissions, getUserId, getUserRole } from '../../../auth/authUtils';
import {
  getPendingSalePickupsData,
  markCompleteSalePickupData
} from '../../../../../lib/data/SalePickups';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

async function getPendingSalePickupsAPI(req, res, userId, userRole) {
  try {
    const { detailed } = req.query;
    const isDetailed = detailed === 'true' || detailed === true;
    const pickups = await getPendingSalePickupsData(userId, isDetailed, userRole);
    res.status(200).json({ data: pickups });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function completeSalePickupAPI(req, res, userId) {
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
    await markCompleteSalePickupData({ ...body, files, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La recolección ha sido completada.' });
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
        await getPendingSalePickupsAPI(req, res, userId, userRole);
        break;
      case 'POST':
        await completeSalePickupAPI(req, res, userId);
        break;
    }
}

export default handler;
