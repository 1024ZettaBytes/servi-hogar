import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { completeExternalRepairDelivery } from '../../../lib/data/ExternalRepairs';
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
  const ok = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
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

    const evidence = files?.evidence ? one(files.evidence) : null;
    const voucher = files?.voucher ? one(files.voucher) : null;
    const uploadedFiles = {};
    if (evidence) uploadedFiles.evidence = evidence;
    if (voucher) uploadedFiles.voucher = voucher;

    await completeExternalRepairDelivery({
      repairId: one(fields.repairId),
      deliveredBy: userId,
      deliveredByRole: ok,
      method: one(fields.method),
      folio: one(fields.folio),
      paymentAccountId: one(fields.paymentAccountId),
      files: uploadedFiles,
      lastUpdatedBy: userId
    });
    res.status(200).json({ msg: 'Entrega completada con éxito.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
