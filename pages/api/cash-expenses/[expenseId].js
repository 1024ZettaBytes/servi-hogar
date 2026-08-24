import { editCashExpenseData } from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  // Solo el administrador corrige montos de gastos, con bitácora.
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (!validRole) return;

  if (req.method !== 'PUT') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const { expenseId } = req.query;
    const { newValue, reason } = req.body;

    const data = await editCashExpenseData({
      expenseId,
      newValue,
      reason,
      lastUpdatedBy: userId
    });

    res.status(200).json({ msg: 'Monto corregido.', data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
