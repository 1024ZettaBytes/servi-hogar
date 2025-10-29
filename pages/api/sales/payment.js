import { registerSalePayment } from '../../../lib/data/Sales';
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

      const paymentImage = files.paymentImage?.[0] || files.paymentImage;
            
      if (!paymentImage) {
        console.error('No payment image found in request');
        return res.status(400).json({ errorMsg: 'Se requiere una foto del comprobante de pago' });
      }

      // Extract values - formidable v3 returns single values directly, not in arrays
      const saleId = Array.isArray(fields.saleId) ? fields.saleId[0] : fields.saleId;
      const paymentAmount = Array.isArray(fields.paymentAmount) ? parseFloat(fields.paymentAmount[0]) : parseFloat(fields.paymentAmount);
      const paymentDate = Array.isArray(fields.paymentDate) ? new Date(fields.paymentDate[0]) : new Date(fields.paymentDate);
      const result = await registerSalePayment({
        saleId,
        paymentAmount,
        paymentDate,
        paymentImagePath: paymentImage.filepath,
        paymentImageName: paymentImage.originalFilename,
        lastUpdatedBy: userId
      });
      
      res.status(200).json({ msg: 'Pago registrado con éxito!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
