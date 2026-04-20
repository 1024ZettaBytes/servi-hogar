import { getSaleChangeByIdData } from '../../../../lib/data/SaleChanges';
import { validateUserPermissions, getUserId } from '../../auth/authUtils';

async function getSaleChangeByIdAPI(req, res) {
  const { changeId } = req.query;
  try {
    const change = await getSaleChangeByIdData(changeId);
    res.status(200).json({ data: change || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los datos del cambio por garantía. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getSaleChangeByIdAPI(req, res);
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
}

export default handler;
