import { updateSaleCredit } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  const userId = await getUserId(req);

  if (!validRole) return;

  if (req.method === 'PATCH') {
    try {
      const result = await updateSaleCredit({
        ...req.body,
        userId
      });

      res.status(200).json({
        msg: 'Venta actualizada correctamente',
        data: result
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        errorMsg: e.message || 'Error al actualizar la venta'
      });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;