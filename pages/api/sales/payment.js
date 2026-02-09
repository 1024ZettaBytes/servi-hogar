import { registerSalePayment } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId, getUserRole } from '../auth/authUtils';
import { recordAuxActionAndCheckBlocking } from '../../../lib/data/Users';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  
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
            


      // Extract values - formidable v3 returns single values directly, not in arrays
      const saleId = Array.isArray(fields.saleId) ? fields.saleId[0] : fields.saleId;
      const paymentAmount = Array.isArray(fields.paymentAmount) ? parseFloat(fields.paymentAmount[0]) : parseFloat(fields.paymentAmount);
      const paymentDate = Array.isArray(fields.paymentDate) ? new Date(fields.paymentDate[0]) : new Date(fields.paymentDate);
      const paymentMethod = Array.isArray(fields.paymentMethod) ? fields.paymentMethod[0] : fields.paymentMethod;
      const paymentAccountId = Array.isArray(fields.paymentAccountId) ? fields.paymentAccountId[0] : fields.paymentAccountId;
      const isCashSettlement = Array.isArray(fields.isCashSettlement) ? fields.isCashSettlement[0] === 'true' : fields.isCashSettlement === 'true';
      const cashPriceOverride = Array.isArray(fields.cashPriceOverride) ? parseFloat(fields.cashPriceOverride[0]) : (fields.cashPriceOverride ? parseFloat(fields.cashPriceOverride) : null);
      const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';
      if (requiresImage && !paymentImage) {
        console.error('No payment image found in request');
        return res.status(400).json({ errorMsg: 'Se requiere una foto del comprobante de pago' });
      }
      const result = await registerSalePayment({
        saleId,
        paymentAmount,
        paymentDate,
        paymentMethod,
        paymentAccountId: paymentAccountId || null,
        paymentImagePath: requiresImage ? paymentImage.filepath : null,
        paymentImageName: paymentImage ? paymentImage.originalFilename : null,
        isCashSettlement,
        cashPriceOverride,
        lastUpdatedBy: userId
      });
      
      // If AUX user, record action and check blocking
      let wasBlocked = false;
      if (userRole === 'AUX') {
        wasBlocked = await recordAuxActionAndCheckBlocking(userId);
      }
      
      res.status(200).json({ msg: 'Pago registrado con éxito!', data: result, wasBlocked });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
