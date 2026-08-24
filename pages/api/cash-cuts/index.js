import { getCashCutsData } from '../../../lib/data/CashCuts';
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
    const { page = 1, limit = 20, type = null, status = null } = req.query;

    // Un operador solo ve sus propios cortes; oficina y admin ven todos.
    const scopedUserId = validRole === 'OPE' ? userId : req.query.userId || null;

    const data = await getCashCutsData({
      page: Number(page),
      limit: Number(limit),
      type,
      status,
      userId: scopedUserId
    });

    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
