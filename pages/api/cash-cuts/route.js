import { createRouteCashCutData } from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'OPE']);
  if (!validRole) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const { declaredAmount, notes } = req.body;

    const data = await createRouteCashCutData({
      userId,
      declaredAmount,
      notes,
      lastUpdatedBy: userId
    });

    res.status(200).json({ msg: 'Corte generado.', data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
