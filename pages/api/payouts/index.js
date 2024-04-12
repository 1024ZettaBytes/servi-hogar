import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { updatePayoutData, getPayoutsData } from '../../../lib/data/Payouts';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};
async function getPayoutsAPI(req, res, userRole) {
  try {
    let { partner } = req.query;
    if (partner && !['ADMIN', 'AUX'].includes(userRole)) {
      res.status(403).json({ errorMsg: 'No tienes permisos para ver esto :(' });
      return;
    }
    if (!partner && userRole === 'PARTNER') {
      partner = await getUserId(req);
    }
    const payouts = await getPayoutsData(userRole, partner);
    res.status(200).json({ data: payouts });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los pagos de socios. Por favor intente de nuevo.'
    });
  }
}
async function updatePayoutAPI(req, res, userId) {
  try {
    const form = new formidable.IncomingForm();
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
    await updatePayoutData({
      ...body,
      files: Object.keys(files).length > 0 ? files : null,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: '¡Pago actualizado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const userRole = await validateUserPermissions(req, res, [
    'ADMIN',
    'PARTNER',
    'AUX'
  ]);
  switch (req.method) {
    case 'GET':
      await getPayoutsAPI(req, res, userRole);
      break;
    case 'POST':
      break;
    case 'PUT':
      await updatePayoutAPI(req, res, userId);
      break;
    case 'DELETE':
      break;
  }
}

export default handler;
