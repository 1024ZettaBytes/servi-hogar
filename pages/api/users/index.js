import { validateUserPermissions } from '../auth/authUtils';
import {
  getUsersData,
  changeUserStatus,
  saveUserData
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
      case 'DELETE':
        await deleteCustomersAPI(req, res, userId, validRole);
    }
}

export default handler;
