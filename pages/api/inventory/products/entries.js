import { getProductEntriesData, saveProductEntryData } from '../../../../lib/data/Inventory';
import { validateUserPermissions } from '../../auth/authUtils';

async function saveProductEntriesAPI(req, res) {
  try {
    await saveProductEntryData(req.body);
    res.status(200).json({ msg: '¡Entrada registrada con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function getProductEntriesAPI(req, res) {
  try {
    const allEntries = await getProductEntriesData();
    res.status(200).json({ data: allEntries });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getProductEntriesAPI(req, res);
        break;
      case 'POST':
        await saveProductEntriesAPI(req, res);
        break;
      case 'PUT':
        break;
      case 'DELETE':
    }
}

export default handler;
