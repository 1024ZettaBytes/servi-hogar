import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { completeExternalRepairPickupData } from '../../../lib/data/ExternalRepairs';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

const one = (v) => (Array.isArray(v) ? v[0] : v);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
  const ok = await validateUserPermissions(req, res, ['ADMIN', 'OPE']);
  if (!ok) return;
  const userId = await getUserId(req);
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

    const normalizedFiles = {};
    ['photo1', 'photo2', 'photo3', 'photo4'].forEach((f) => {
      if (files?.[f]) normalizedFiles[f] = one(files[f]);
    });

    await completeExternalRepairPickupData({
      repairId: one(fields.repairId),
      operatorId: userId,
      brand: one(fields.brand),
      serialNumber: one(fields.serialNumber),
      files: normalizedFiles,
      conditionNote: one(fields.conditionNote),
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Recolección completada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
