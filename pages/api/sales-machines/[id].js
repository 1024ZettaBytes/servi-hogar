import { getSalesMachineByIdData } from '../../../lib/data/SalesMachines';
import { validateUserPermissions } from '../auth/authUtils'; 

async function getMachineByIdAPI(req, res) {
  try {
    const { id } = req.query;
    const salesMachine = await getSalesMachineByIdData(id);
    if (!salesMachine) {
      return res.status(404).json({ errorMsg: 'Equipo de venta no encontrado' });
    }
    return res.status(200).json({ data: salesMachine });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMsg: error.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]); 
  
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