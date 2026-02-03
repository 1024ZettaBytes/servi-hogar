import { getUserId, getUserRole } from '../auth/authUtils';
import { getAuxUsersData } from '../../../lib/data/Payroll';

async function getAuxUsersAPI(req, res) {
  try {
    const userRole = await getUserRole(req, res);
    if (!userRole) return;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ errorMsg: 'No tienes permisos para ver esto' });
    }
    
    const auxUsers = await getAuxUsersData();
    res.status(200).json({ data: auxUsers });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar los usuarios. Por favor intente de nuevo.'
    });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await getAuxUsersAPI(req, res);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
