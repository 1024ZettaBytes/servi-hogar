import { getUsedInventoryData } from '../../../../lib/data/Inventory';
import { validateUserPermissions } from '../../auth/authUtils';


async function getUsedProductsAPI(req, res) {
  try {
    const allUsed = await getUsedInventoryData();
    res.status(200).json({ data: allUsed });
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
        await getUsedProductsAPI(req, res);
        break;
      case 'POST':
        break;
      case 'PUT':
        break;
      case 'DELETE':
    }
}

export default handler;
