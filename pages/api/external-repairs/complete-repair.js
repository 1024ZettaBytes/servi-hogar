import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { completeExternalRepair } from '../../../lib/data/ExternalRepairs';
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
  // Only the technician (or admin) closes the repair with evidence.
  const ok = await validateUserPermissions(req, res, ['ADMIN', 'TEC']);
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

    // Evidence photos may arrive as photo1..photoN (individual fields) or as a
    // single multi-file "photos" field. Normalize both into a flat map.
    const normalizedFiles = {};
    Object.keys(files || {}).forEach((key) => {
      const value = files[key];
      if (Array.isArray(value)) {
        value.forEach((f, i) => {
          if (f) normalizedFiles[`${key}_${i}`] = f;
        });
      } else if (value) {
        normalizedFiles[key] = value;
      }
    });

    await completeExternalRepair({
      repairId: one(fields.repairId),
      description: one(fields.description),
      files: normalizedFiles,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Reparación marcada como reparada.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
