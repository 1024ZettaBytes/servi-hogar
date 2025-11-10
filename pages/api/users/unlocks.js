import { validateUserPermissions } from '../auth/authUtils';
import { getUserUnlocks } from '../../../lib/data/Users';

async function getUserUnlocksAPI(req, res) {
  try {
    const unlocks = await getUserUnlocks();
    res.status(200).json({ data: unlocks });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los desbloqueos. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (validRole) {
    switch (req.method) {
      case 'GET':
        await getUserUnlocksAPI(req, res);
        break;
    }
  }
}

export default handler;
