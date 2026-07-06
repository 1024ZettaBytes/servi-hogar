import {
  getPendingReturnMachines,
  confirmMachineReturnByTechnician,
  rejectMachineReturnByTechnician
} from '../../../lib/data/Machines';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';

async function getPendingReturnsAPI(req, res, userId, userRole) {
  try {
    const machines = await getPendingReturnMachines(userId, userRole);
    res.status(200).json({ data: machines });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg: 'Hubo un problema al obtener los equipos por confirmar.'
    });
  }
}

async function resolvePendingReturnAPI(req, res, userId) {
  try {
    const { machineId, action } = req.body;
    if (!machineId) {
      return res.status(400).json({ errorMsg: 'Falta el ID del equipo (machineId)' });
    }
    if (action === 'reject') {
      await rejectMachineReturnByTechnician({ machineId, technicianId: userId });
      return res.status(200).json({ msg: 'Regreso marcado como no recibido' });
    }
    await confirmMachineReturnByTechnician({ machineId, technicianId: userId });
    return res.status(200).json({ msg: 'Recepción del equipo confirmada con éxito' });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === 'Internal'
          ? e.message
          : 'Hubo un problema al procesar la confirmación. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['TEC', 'ADMIN', 'AUX']);
  if (!validRole) return;
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  switch (req.method) {
    case 'GET':
      await getPendingReturnsAPI(req, res, userId, userRole);
      break;
    case 'POST':
      await resolvePendingReturnAPI(req, res, userId);
      break;
    default:
      res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
