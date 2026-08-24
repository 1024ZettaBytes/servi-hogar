import {
  getCashCutDetailData,
  editCashCutAmountData
} from '../../../lib/data/CashCuts';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const { cutId } = req.query;

  if (req.method === 'GET') {
    const validRole = await validateUserPermissions(req, res, [
      'ADMIN',
      'AUX',
      'OPE'
    ]);
    if (!validRole) return;

    try {
      const data = await getCashCutDetailData(cutId);

      // Un operador solo puede ver el detalle de sus propios cortes.
      if (validRole === 'OPE') {
        const userId = await getUserId(req);
        if (data.cut.user?._id?.toString() !== userId.toString()) {
          return res.status(403).json({ errorMsg: 'No autorizado' });
        }
      }

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errorMsg: e.message });
    }
  }

  if (req.method === 'PUT') {
    // Solo el administrador corrige montos, y siempre queda bitácora.
    const validRole = await validateUserPermissions(req, res, ['ADMIN']);
    if (!validRole) return;

    try {
      const userId = await getUserId(req);
      const { field, newValue, reason } = req.body;

      const data = await editCashCutAmountData({
        cutId,
        field,
        newValue,
        reason,
        lastUpdatedBy: userId
      });

      return res.status(200).json({ msg: 'Monto corregido.', data });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errorMsg: e.message });
    }
  }

  return res.status(405).json({ errorMsg: 'Método no permitido' });
}

export default handler;
