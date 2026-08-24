import { getRouteCashSummaryData } from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, [
    'ADMIN',
    'AUX',
    'OPE'
  ]);
  if (!validRole) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    // Un admin puede consultar el pendiente de cualquier persona de ruta.
    const targetUserId =
      validRole === 'ADMIN' && req.query.userId ? req.query.userId : userId;

    const data = await getRouteCashSummaryData(targetUserId);
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
