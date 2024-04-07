import { getPartnersData } from '../../../lib/data/Users';
import { validateUserPermissions } from '../auth/authUtils';

async function getPartnersAPI(req, res) {
  try {
    const { detailed } = req.query;
    const partners = await getPartnersData(detailed);
    res.status(200).json({ data: partners });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al obtener la lista de socios. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getPartnersAPI(req, res);
        break;
      case 'POST':
        return;
      case 'PUT':
        return;
      case 'DELETE':
        return;
    }
}

export default handler;
