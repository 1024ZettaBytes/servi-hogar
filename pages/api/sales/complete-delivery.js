import { completeSaleDelivery } from '../../../lib/data/Sales';
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
    console.log('=== Complete Sale Delivery API Called ===');
    console.log('User ID:', userId);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    
    try {
      // Parse the multipart form data using the same approach as rent delivery
      const form = new formidable.IncomingForm();
      form.multiples = true;
      form.maxFileSize = 50 * 1024 * 1024; // 50MB per file
      form.maxTotalFileSize = 200 * 1024 * 1024; // 200MB total
      
      console.log('Starting formidable parse...');
      const { fields, files } = await new Promise(function (resolve, reject) {
        form.parse(req, function (err, fields, files) {
          if (err) {
            console.error('Formidable parse error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
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

      // Parse the body field which contains all the sale data as JSON
      const bodyStr = Array.isArray(fields.body) ? fields.body[0] : fields.body;
      
      console.log('Body field provided:', !!bodyStr);
      
      let saleData = null;
      if (bodyStr) {
        try {
          saleData = JSON.parse(bodyStr);
          console.log('Sale data parsed successfully');
          console.log('- Sale ID:', saleData.saleId);
          console.log('- Delivery Date:', saleData.deliveryDate);
          console.log('- Customer Data provided:', !!saleData.customerData);
        } catch (e) {
          console.error('Error parsing body data:', e);
          return res.status(400).json({ errorMsg: 'Datos de venta inválidos' });
        }
      } else {
        console.error('No body field in request');
        return res.status(400).json({ errorMsg: 'Faltan datos de venta' });
      }
      
      // Get uploaded images - now using generic field names
      console.log('Files received:', Object.keys(files));
      const ineImage = Array.isArray(files.ine) ? files.ine[0] : files.ine;
      const frontalImage = Array.isArray(files.frontal) ? files.frontal[0] : files.frontal;
      const labelImage = Array.isArray(files.label) ? files.label[0] : files.label;
      const boardImage = Array.isArray(files.board) ? files.board[0] : files.board;
      
      // Log file sizes
      if (ineImage) console.log('INE image size:', (ineImage.size / 1024).toFixed(2), 'KB');
      if (frontalImage) console.log('Frontal image size:', (frontalImage.size / 1024).toFixed(2), 'KB');
      if (labelImage) console.log('Label image size:', (labelImage.size / 1024).toFixed(2), 'KB');
      if (boardImage) console.log('Board image size:', (boardImage.size / 1024).toFixed(2), 'KB');

      // More detailed validation
      const missingImages = [];
      if (!ineImage) missingImages.push('INE');
      if (!frontalImage) missingImages.push('Frontal');
      if (!labelImage) missingImages.push('Etiqueta');
      if (!boardImage) missingImages.push('Tablero');
      
      if (missingImages.length > 0) {
        console.error('❌ Missing images:', missingImages);
        return res.status(400).json({ 
          errorMsg: `Faltan las siguientes imágenes: ${missingImages.join(', ')}` 
        });
      }
      
      console.log('✅ All images present, proceeding to upload...');
      console.log('Total payload size:', (
        (ineImage?.size || 0) + 
        (frontalImage?.size || 0) + 
        (labelImage?.size || 0) + 
        (boardImage?.size || 0)
      ) / 1024 / 1024, 'MB');
      const result = await completeSaleDelivery({ 
        saleId: saleData.saleId,
        deliveryDate: saleData.deliveryDate,
        deliveredBy: userId,
        ineImagePath: ineImage.filepath,
        ineImageName: ineImage.originalFilename,
        frontalImagePath: frontalImage.filepath,
        frontalImageName: frontalImage.originalFilename,
        labelImagePath: labelImage.filepath,
        labelImageName: labelImage.originalFilename,
        boardImagePath: boardImage.filepath,
        boardImageName: boardImage.originalFilename,
        customerData: saleData.customerData
      });
      
      console.log('✅ Sale delivery completed successfully');
      res.status(200).json({ msg: 'Entrega completada con éxito!', data: result });
    } catch (e) {
      console.error('❌ Error in complete-delivery API');
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
      
      // Check for specific error types
      if (e.message && e.message.includes('maxFileSize')) {
        console.error('File size limit exceeded');
        return res.status(413).json({ 
          errorMsg: 'Una o más imágenes son demasiado grandes. Por favor, reduzca el tamaño de las imágenes.' 
        });
      }
      
      if (e.message && e.message.includes('maxTotalFileSize')) {
        console.error('Total file size limit exceeded');
        return res.status(413).json({ 
          errorMsg: 'El tamaño total de las imágenes es demasiado grande. Por favor, reduzca el tamaño.' 
        });
      }
      
      if (e.code) {
        console.error('Error code:', e.code);
      }
      
      res.status(500).json({ errorMsg: e.message || 'Error al completar la entrega' });
    }
  } else {
    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method);
    }
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
