import { scheduleCollectionVisitData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);

  if (validRole && req.method === 'POST') {
    try {
      const { saleId } = req.body;
      const result = await scheduleCollectionVisitData({ 
        saleId, 
        lastUpdatedBy: userId 
      });
      res.status(200).json({ msg: 'Visita de cobranza agendada!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;