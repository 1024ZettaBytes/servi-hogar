import { getWarehouseMachineByIdData } from '../../../lib/data/WarehouseMachines';
import { validateUserPermissions } from '../auth/authUtils';

async function getMachineByIdAPI(req, res) {
  try {
    const { id } = req.query;
    const machine = await getWarehouseMachineByIdData(id);
    if (!machine) {
      return res.status(404).json({ errorMsg: 'Máquina de almacén no encontrada' });
    }
    return res.status(200).json({ data: machine });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMsg: error.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);

  if (validRole) {
    switch (req.method) {
      case 'GET':
        await getMachineByIdAPI(req, res);
        break;
      default:
        res.status(405).json({ errorMsg: 'Método no permitido' });
    }
  }
}

export default handler;
