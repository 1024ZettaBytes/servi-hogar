import { completeCollectionVisitData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'OPE']);
  const userId = await getUserId(req);

  if (validRole && req.method === 'POST') {
    try {
      const { deliveryId, outcome } = req.body;
      
      if (!outcome) {
        return res.status(400).json({ errorMsg: 'Debe seleccionar un motivo.' });
      }

      const result = await completeCollectionVisitData({ 
        deliveryId, 
        outcome, 
        lastUpdatedBy: userId 
      });
      
      res.status(200).json({ msg: 'Visita completada.', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(403).json({ errorMsg: 'No autorizado' });
  }
}

export default handler;