import { convertMachineToSaleData } from '../../../lib/data/SalesMachines';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (!validRole) return;

  if (req.method === 'POST') {
    try {
      const userId = await getUserId(req);
      const form = new formidable.IncomingForm();
      form.multiples = true;

      const { fields, files } = await new Promise(function (resolve, reject) {
        form.parse(req, function (err, fields, files) {
          if (err) {
            console.error(err);
            reject(
              new Error(
                'Ocurrió un error interno, por favor contacte al administrador.'
              )
            );
            return;
          }
          resolve({ fields, files });
        });
      });

      await convertMachineToSaleData({
        machineId: fields.machineId,
        serialNumber: fields.serialNumber,
        files,
        lastUpdatedBy: userId
      });

      return res.status(200).json({
        msg: 'Equipo convertido a equipo de venta exitosamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ errorMsg: error.message });
    }
  } else {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
