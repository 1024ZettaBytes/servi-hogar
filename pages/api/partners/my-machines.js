import { getPartnerMachinesData } from '../../../lib/data/Partners';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function getPartnermachinesAPI(req, res) {
  try {
    let { partner } = req.query;
    if (!partner) {
      partner = await getUserId(req);
    }

    const partners = await getPartnerMachinesData(partner);
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
  await validateUserPermissions(req, res, ['PARTNER', 'ADMIN', 'AUX']);
  switch (req.method) {
    case 'GET':
      await getPartnermachinesAPI(req, res);
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
