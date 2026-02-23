import { getUserId, validateUserPermissions, SUPER_USERS } from '../auth/authUtils';
import { User } from '../../../lib/models/User';
import { connectToDatabase } from '../../../lib/db';
import {
  getUsersData,
  changeUserStatus,
  saveUserData,
  unlockUser
} from '../../../lib/data/Users';
async function getUsersAPI(req, res) {
  try {
    const allUsers = await getUsersData();
    res.status(200).json({ data: allUsers });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar los usuarios. Por favor intente de nuevo.'
    });
  }
}
async function updateUserAPI(req, res) {
  try {
    const { operation } = req.body;
    switch (operation) {
      case 'STATUS': {
        await changeUserStatus({ ...req.body });
      }
    }
    res.status(200).json({ msg: '¡Usuario actualizado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function saveUserAPI(req, res) {
  try {
    await saveUserData({ ...req.body });
    res.status(200).json({ msg: '¡Usuario guardado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function unlockUserAPI(req, res) {
  try {
    const { _id, reason } = req.body;
    const unlockedBy = await getUserId(req);
    
    if (!unlockedBy) {
      return res.status(401).json({ errorMsg: 'Usuario no autenticado.' });
    }
    
    await connectToDatabase();
    await User.init();
    const userToUnlock = await User.findById(_id).populate('role');
    if (!userToUnlock) {
      return res.status(404).json({ errorMsg: 'Usuario a desbloquear no encontrado.' });
    }
    
    let isSuperUser = false;
    const unlockerUser = await User.findById(unlockedBy);
    if (unlockerUser && SUPER_USERS.includes(unlockerUser.id)) {
      isSuperUser = true;
    }
    
    if (userToUnlock.role?.id === 'ADMIN' && !isSuperUser) {
      return res.status(403).json({ errorMsg: 'No tienes permisos para desbloquear a otro administrador.' });
    }
    
    await unlockUser({ _id, reason, unlockedBy });
    res.status(200).json({ msg: '¡Usuario desbloqueado con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN']);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getUsersAPI(req, res);
        break;
      case 'POST':
        await saveUserAPI(req, res);
        break;
      case 'PUT':
        await updateUserAPI(req, res);
        break;
      case 'PATCH':
        await unlockUserAPI(req, res);
        break;
      case 'DELETE':
        await deleteCustomersAPI(req, res, userId, validRole);
    }
}

export default handler;
