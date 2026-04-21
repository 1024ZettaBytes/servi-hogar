import { sellRentMachineData } from '../../../lib/data/Rents';
import formidable from 'formidable';
import { getUserId, validateUserPermissions } from '../auth/authUtils';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST': {
      const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
      if (!validRole) return;

      const userId = await getUserId(req);

      try {
        const form = formidable({ multiples: false });
        
        const [fields, files] = await new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve([fields, files]);
          });
        });

        // Helper to get field value (formidable v3 may return arrays)
        const getField = (key) => {
          const val = fields[key];
          if (Array.isArray(val)) return val[0];
          return val;
        };

        const paymentImage = files.paymentImage?.[0] || files.paymentImage;

        const saleData = {
          rentId: getField('rentId'),
          isUpfrontCashPayment: getField('isUpfrontCashPayment') === 'true',
          cashPrice: getField('cashPrice') ? parseFloat(getField('cashPrice')) : null,
          totalAmount: getField('totalAmount') ? parseFloat(getField('totalAmount')) : null,
          initialPayment: getField('initialPayment') ? parseFloat(getField('initialPayment')) : null,
          totalWeeks: getField('totalWeeks') ? parseInt(getField('totalWeeks')) : null,
          paymentMethod: getField('paymentMethod') || null,
          paymentAccountId: getField('paymentAccountId') || null,
          paymentImagePath: paymentImage ? paymentImage.filepath : null,
          paymentImageName: paymentImage ? paymentImage.originalFilename : null,
          createdBy: userId
        };

        const result = await sellRentMachineData(saleData);
        return res.status(200).json({ data: result, msg: 'Máquina vendida exitosamente' });
      } catch (e) {
        console.error(e);
        return res.status(400).json({ errorMsg: e.message });
      }
    }
    default:
      return res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}
