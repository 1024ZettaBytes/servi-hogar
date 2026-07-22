import { validateUserPermissions } from '../auth/authUtils';
import { getRecolectadasReparacionExternaData } from '../../../lib/data/ExternalRepairs';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
  const ok = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
  if (!ok) return;
  try {
    const data = await getRecolectadasReparacionExternaData();
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

export default handler;
