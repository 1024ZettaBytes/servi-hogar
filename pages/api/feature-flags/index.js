import {
  getFeatureFlagsData,
  setFeatureFlagData
} from '../../../lib/data/FeatureFlags';
import { validateUserPermissions, getUserId } from '../auth/authUtils';

async function getFeatureFlagsAPI(req, res) {
  try {
    const flags = await getFeatureFlagsData();
    res.status(200).json({ data: flags });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al consultar las configuraciones.'
    });
  }
}

async function updateFeatureFlagAPI(req, res, userId) {
  try {
    const { key, enabled } = req.body;
    if (!key) {
      return res.status(400).json({ errorMsg: 'Se requiere la clave de la configuración.' });
    }
    const flag = await setFeatureFlagData({ key, enabled, lastUpdatedBy: userId });
    res.status(200).json({ msg: 'Configuración actualizada.', data: flag });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      // Any authenticated user can read flag state (the app reacts to it),
      // but only admins manage them from the Configuraciones page.
      const canRead = await validateUserPermissions(req, res, [
        'ADMIN',
        'AUX',
        'OPE',
        'SUB',
        'TEC'
      ]);
      if (!canRead) return;
      await getFeatureFlagsAPI(req, res);
      break;
    }
    case 'PUT': {
      const canManage = await validateUserPermissions(req, res, ['ADMIN']);
      if (!canManage) return;
      const userId = await getUserId(req);
      await updateFeatureFlagAPI(req, res, userId);
      break;
    }
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
      break;
  }
}

export default handler;
