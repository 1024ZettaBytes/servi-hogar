import { getProductsData, saveProductData } from '../../../../lib/data/Inventory';
import { validateUserPermissions } from '../../auth/authUtils';

async function saveProductsAPI(req, res) {
  try {
    await saveProductData(req.body);
    res.status(200).json({ msg: '¡Producto guardado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function getProductsAPI(req, res) {
  try {
    const { term, detailed } = req.query;
    const allProducts = await getProductsData(term, detailed || false);
    res.status(200).json({ data: allProducts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX', 'TEC']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getProductsAPI(req, res);
        break;
      case 'POST':
        await saveProductsAPI(req, res);
        break;
      case 'PUT':
        break;
      case 'DELETE':
    }
}

export default handler;
