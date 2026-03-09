import { validateUserPermissions, getUserId } from '../../../auth/authUtils';
import { completeCancellationPickupData } from '../../../../../lib/data/SalePickups';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

async function completeCancellationPickupAPI(req, res, userId) {
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
    await completeCancellationPickupData({ ...body, files, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'La recolección de cancelación ha sido completada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  if (validRole && req.method === 'POST') {
    await completeCancellationPickupAPI(req, res, userId);
  } else if (!validRole) {
    res.status(403).json({ errorMsg: 'No tienes permisos para realizar esta acción' });
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
