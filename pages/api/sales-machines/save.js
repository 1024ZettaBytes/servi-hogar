import { saveSalesMachineData } from '../../../lib/data/SalesMachines';
import { getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (req.method === 'POST') {
    try {
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

      const result = await saveSalesMachineData({ 
        brand: fields.brand,
        capacity: fields.capacity,
        cost: fields.cost,
        serialNumber: fields.serialNumber,
        files,
        lastUpdatedBy: userId 
      });
      return res.status(200).json({ 
        result, 
        msg: 'Equipo de venta guardado exitosamente' 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
