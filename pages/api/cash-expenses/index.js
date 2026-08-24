import {
  createCashExpenseData,
  getCashExpensesData
} from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

const one = (v) => (Array.isArray(v) ? v[0] : v);

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (!validRole) return;

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20, onlyOpen } = req.query;
      const data = await getCashExpensesData({
        page: Number(page),
        limit: Number(limit),
        onlyOpen: onlyOpen === 'true'
      });
      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errorMsg: e.message });
    }
  }

  if (req.method === 'POST') {
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

      const data = await createCashExpenseData({
        concept: one(fields.concept),
        description: one(fields.description),
        amount: one(fields.amount),
        date: one(fields.date),
        receiptFile,
        createdBy: userId
      });

      return res.status(200).json({ msg: 'Gasto registrado.', data });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errorMsg: e.message });
    }
  }

  return res.status(405).json({ errorMsg: 'Método no permitido' });
}

export default handler;
