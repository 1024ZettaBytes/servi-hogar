import { saveSaleData } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'POST') {
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

      const isUpfrontCashPayment = getField('isUpfrontCashPayment') === 'true';
      const paymentImage = files.paymentImage?.[0] || files.paymentImage;

      const saleData = {
        machineId: getField('machineId') || null,
        serialNumber: getField('serialNumber') || '',
        customerId: getField('customerId') || null,
        saleDate: getField('saleDate') ? new Date(getField('saleDate')) : new Date(),
        cashPrice: getField('cashPrice') ? parseFloat(getField('cashPrice')) : null,
        totalAmount: getField('totalAmount') ? parseFloat(getField('totalAmount')) : null,
        initialPayment: getField('initialPayment') ? parseFloat(getField('initialPayment')) : null,
        totalWeeks: getField('totalWeeks') ? parseInt(getField('totalWeeks')) : null,
        createdBy: userId,
        isUpfrontCashPayment,
        paymentMethod: getField('paymentMethod') || null,
        paymentAccountId: getField('paymentAccountId') || null,
        paymentImagePath: paymentImage ? paymentImage.filepath : null,
        paymentImageName: paymentImage ? paymentImage.originalFilename : null,
      };

      const result = await saveSaleData(saleData);
      res.status(200).json({ msg: 'Venta registrada con éxito!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
