import { completeRepairReturnDelivery } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: '50mb',
  },
};

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['OPE']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'POST') {
    console.log('=== Complete Repair Return Delivery API Called ===');
    console.log('User ID:', userId);
    
    try {
      const form = new formidable.IncomingForm();
      form.multiples = false;
      form.maxFileSize = 50 * 1024 * 1024; // 50MB
      
      console.log('Starting formidable parse...');
      const { fields, files } = await new Promise(function (resolve, reject) {
        form.parse(req, function (err, fields, files) {
          if (err) {
            console.error('Formidable parse error:', err);
            reject(
              new Error(
                "Ocurrió un error interno, por favor contacte al administrador."
              )
            );
            return;
          }
          console.log('Formidable parse successful');
          resolve({ fields, files });
        });
      });

      // Parse the body field
      const bodyStr = Array.isArray(fields.body) ? fields.body[0] : fields.body;
      console.log('Body field provided:', !!bodyStr);
      
      let deliveryData = null;
      if (bodyStr) {
        try {
          deliveryData = JSON.parse(bodyStr);
          console.log('Delivery data parsed successfully');
          console.log('- Sale ID:', deliveryData.saleId);
          console.log('- Delivery Date:', deliveryData.deliveryDate);
        } catch (e) {
          console.error('Error parsing body data:', e);
          return res.status(400).json({ errorMsg: 'Datos de entrega inválidos' });
        }
      } else {
        console.error('No body field in request');
        return res.status(400).json({ errorMsg: 'Faltan datos de entrega' });
      }
      
      // Get evidence image
      console.log('Files received:', Object.keys(files));
      const evidenceImage = Array.isArray(files.evidence) ? files.evidence[0] : files.evidence;
      
      if (!evidenceImage) {
        console.error('❌ Missing evidence image');
        return res.status(400).json({ errorMsg: 'Se requiere una imagen de evidencia' });
      }
      
      console.log('Evidence image size:', (evidenceImage.size / 1024).toFixed(2), 'KB');
      console.log('✅ Evidence image present, proceeding...');

      const result = await completeRepairReturnDelivery({ 
        saleId: deliveryData.saleId,
        deliveryDate: deliveryData.deliveryDate,
        deliveredBy: userId,
        evidenceImagePath: evidenceImage.filepath,
        evidenceImageName: evidenceImage.originalFilename
      });
      
      console.log('✅ Repair return delivery completed successfully');
      res.status(200).json({ msg: 'Entrega de reparación completada con éxito!', data: result });
    } catch (e) {
      console.error('❌ Error in complete-repair-return API');
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
      
      if (e.message && e.message.includes('maxFileSize')) {
        console.error('File size limit exceeded');
        return res.status(413).json({ 
          errorMsg: 'La imagen es demasiado grande. Por favor, reduzca el tamaño.' 
        });
      }
      
      res.status(500).json({ errorMsg: e.message || 'Error al completar la entrega de reparación' });
    }
  } else {
    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method);
    }
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
