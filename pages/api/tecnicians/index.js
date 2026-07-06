import { validateUserPermissions } from '../auth/authUtils';
import {
  updateTecnicianData,
  getMaxMachineNum,
  MACHINE_BLOCK_SIZE
} from '../../../lib/data/Users';

async function updateTecnicianAPI(req, res) {
  try {
    await updateTecnicianData({ ...req.body });
    res.status(200).json({ msg: '¡Usuario actualizado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function getTecnicianRangeInfoAPI(req, res) {
  try {
    const maxMachineNum = await getMaxMachineNum();
    res.status(200).json({ data: { maxMachineNum, blockSize: MACHINE_BLOCK_SIZE } });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Error al consultar la información de equipos.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getTecnicianRangeInfoAPI(req, res);
        break;
      case 'POST':
        break;
      case 'PUT':
        await updateTecnicianAPI(req, res);
        break;
      case 'DELETE':
        break;
    }
}

export default handler;
