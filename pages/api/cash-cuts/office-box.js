import {
  getOfficeBoxStatusData,
  getOfficeCashUsersData
} from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (!validRole) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const [box, users] = await Promise.all([
      getOfficeBoxStatusData(),
      getOfficeCashUsersData(userId)
    ]);
    res.status(200).json({ data: { ...box, availableUsers: users } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
