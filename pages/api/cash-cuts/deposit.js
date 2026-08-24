import { registerCashCutDepositData } from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

const one = (v) => (Array.isArray(v) ? v[0] : v);

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'OPE']);
  if (!validRole) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);

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

    const receiptFile = files?.receipt ? one(files.receipt) : null;

    await registerCashCutDepositData({
      cutId: one(fields.cutId),
      userId,
      userRole: validRole,
      depositAccountId: one(fields.depositAccountId),
      depositAmount: one(fields.depositAmount),
      depositFolio: one(fields.depositFolio),
      receiptFile,
      lastUpdatedBy: userId
    });

    res.status(200).json({ msg: 'Depósito registrado.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
