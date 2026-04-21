import {
  saveSaleChangeData,
  cancelSaleChangeData
} from '../../../../lib/data/SaleChanges';
import { validateUserPermissions, getUserId } from '../../auth/authUtils';

async function saveSaleChangeAPI(req, res, userId) {
  try {
    const newChange = await saveSaleChangeData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: '¡Cambio por garantía agendado!', change: newChange });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function cancelSaleChangeAPI(req, res, userId) {
  try {
    await cancelSaleChangeData({ ...req.body, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'Cambio por garantía cancelado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'OPE']);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case 'POST':
        await saveSaleChangeAPI(req, res, userId);
        return;
      case 'DELETE':
        await cancelSaleChangeAPI(req, res, userId);
        return;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
}

export default handler;
