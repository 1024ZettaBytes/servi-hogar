import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { getRolesData } from '../../../lib/data/Roles';
async function getRolesAPI(req, res) {
  try {
    const allRoles = await getRolesData();
    res.status(200).json({ data: allRoles });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los roles. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getRolesAPI(req, res);
        break;
      case 'POST':
        break;
      case 'PUT':
        break;
      case 'DELETE':
    }
}

export default handler;
