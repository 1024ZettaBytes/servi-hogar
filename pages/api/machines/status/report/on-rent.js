import { getOnRentMachinesReportData } from '../../../../../lib/data/Machines';
import { validateUserPermissions } from '../../../auth/authUtils';

async function getOnRentMachinesReportAPI(req, res) {
  try {
    const  data = await getOnRentMachinesReportData();
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        'Hubo un problema al consultar el reporte los equipos rentados. Por favor intente de nuevo.'
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
        await getOnRentMachinesReportAPI(req, res);
        break;
      case 'POST':
        break;
      case 'PUT':
        break;
      case 'DELETE':
    }
}

export default handler;
