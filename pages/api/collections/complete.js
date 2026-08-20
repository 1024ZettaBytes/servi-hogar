import { completeCollectionVisitData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'OPE']);
  const userId = await getUserId(req);

  if (validRole && req.method === 'POST') {
    try {
      const { deliveryId, outcome, paymentInCash, cashAmount } = req.body;

      if (!outcome) {
        return res.status(400).json({ errorMsg: 'Debe seleccionar un motivo.' });
      }

      const isCashPayment = outcome === 'PAGO' && paymentInCash === true;

      if (isCashPayment) {
        const amount = Number(cashAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return res
            .status(400)
            .json({ errorMsg: 'Debe indicar una cantidad válida de efectivo recibido.' });
        }
      }

      const result = await completeCollectionVisitData({
        deliveryId,
        outcome,
        paymentInCash: isCashPayment,
        cashAmount,
        lastUpdatedBy: userId
      });

      const msg = isCashPayment
        ? 'Visita completada y abono en efectivo registrado.'
        : 'Visita completada.';

      res.status(200).json({ msg, data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(403).json({ errorMsg: 'No autorizado' });
  }
}

export default handler;