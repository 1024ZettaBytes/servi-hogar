import { getMachinesReportData } from '../../../../../lib/data/Machines';
import { getLastRecordData } from '../../../../../lib/data/Records';
import { validateUserPermissions } from '../../../auth/authUtils';

async function getMachineStatusAPI(req, res) {
  try {
    const prev = await getLastRecordData('MACHINES_REPORT');
    const  current = await getMachinesReportData();
    res.status(200).json({ data: {prev, current }});
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar el reporte los equipos. Por favor intente de nuevo.'
    });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, [
    'ADMIN',
  ]);
  if (validRole)
    switch (req.method) {
      case 'GET':
        await getMachineStatusAPI(req, res);
        break;
      case 'POST':
        break;
      case 'PUT':
        break;
      case 'DELETE':
    }
}

export default handler;
