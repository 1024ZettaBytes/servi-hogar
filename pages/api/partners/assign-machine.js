import { assignMachineToPartnerData } from '../../../lib/data/Partners';
import { validateUserPermissions } from '../auth/authUtils'; 

async function assignMachineAPI(req, res) {
  try {
    const data = req.body;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(400).json({ 
        errorMsg: 'Faltan datos: envíe un objeto o un arreglo de asignaciones.' 
      });
    }

    const result = await assignMachineToPartnerData({ data });
    res.status(200).json(result);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: e.message || 'Error al asignar la máquina al socio'
    });
  }
}

async function handler(req, res) {
  //const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  
  //if (validRole) {
    switch (req.method) {
      case 'POST':
        await assignMachineAPI(req, res);
        break;
    }
  //}
}

export default handler;