import { validateUserPermissions, getUserId } from '../auth/authUtils';
import { getToolsData, seedDefaultTools, addTool } from '../../../lib/data/Tools';
import {
  getAllToolAssignments,
  assignToolsToTechnician,
  auxVerifyToolAssignment,
  getPendingAuxVerifications,
  checkAndRunPeriodicReset
} from '../../../lib/data/TechnicianTools';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

async function getToolsAPI(req, res) {
  try {
    await checkAndRunPeriodicReset();
    const tools = await seedDefaultTools();
    const { technicians, assignments } = await getAllToolAssignments();
    const pendingAuxVerifications = await getPendingAuxVerifications();
    res
      .status(200)
      .json({ data: { tools, technicians, assignments, pendingAuxVerifications } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function assignToolsAPI(req, res) {
  try {
    const auxUserId = await getUserId(req);
    const form = new formidable.IncomingForm();
    form.multiples = false;

    const { fields, files } = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          console.error(err);
          reject(
            new Error('Ocurrió un error interno, por favor contacte al administrador.')
          );
          return;
        }
        resolve({ fields, files });
      });
    });

    const body = JSON.parse(fields?.body);

    await assignToolsToTechnician({
      technicianId: body.technicianId,
      toolsList: body.toolsList,
      auxUserId,
      files
    });

    res.status(200).json({ msg: '¡Herramientas asignadas con éxito!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function auxVerifyAPI(req, res) {
  try {
    const auxUserId = await getUserId(req);
    const form = new formidable.IncomingForm();
    form.multiples = false;

    const { fields, files } = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          console.error(err);
          reject(
            new Error('Ocurrió un error interno, por favor contacte al administrador.')
          );
          return;
        }
        resolve({ fields, files });
      });
    });

    const body = JSON.parse(fields?.body);

    await auxVerifyToolAssignment({
      assignmentId: body.assignmentId,
      auxUserId,
      files
    });

    res
      .status(200)
      .json({ msg: '¡Verificación completada! Los auxiliares han sido desbloqueados.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function addToolAPI(req, res) {
  try {
    const form = new formidable.IncomingForm();
    const { fields } = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          reject(new Error('Error al procesar la solicitud.'));
          return;
        }
        resolve({ fields });
      });
    });
    const body = JSON.parse(fields?.body);
    await addTool({ name: body.name });
    res.status(200).json({ msg: '¡Herramienta agregada con éxito!' });
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
        await getToolsAPI(req, res);
        break;
      case 'POST':
        await assignToolsAPI(req, res);
        break;
      case 'PUT':
        await auxVerifyAPI(req, res);
        break;
      case 'PATCH':
        await addToolAPI(req, res);
        break;
    }
}

export default handler;
