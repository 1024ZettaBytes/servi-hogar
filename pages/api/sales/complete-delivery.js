import { completeSaleDelivery } from '../../../lib/data/Sales';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['OPE']);
  const userId = await getUserId(req);
  
  if (validRole && req.method === 'POST') {
    try {
      // Parse the multipart form data
      const form = formidable({ multiples: true });
      
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      const saleId = Array.isArray(fields.saleId) ? fields.saleId[0] : fields.saleId;
      const deliveryDate = Array.isArray(fields.deliveryDate) ? fields.deliveryDate[0] : fields.deliveryDate;
      const customerDataStr = Array.isArray(fields.customerData) ? fields.customerData[0] : fields.customerData;
      
      // Parse customer data if provided
      let customerData = null;
      if (customerDataStr) {
        try {
          customerData = JSON.parse(customerDataStr);
        } catch (e) {
          console.error('Error parsing customer data:', e);
        }
      }
      
      // Get uploaded images
      const ineImage = Array.isArray(files.ineImage) ? files.ineImage[0] : files.ineImage;
      const frontalImage = Array.isArray(files.frontalImage) ? files.frontalImage[0] : files.frontalImage;
      const labelImage = Array.isArray(files.labelImage) ? files.labelImage[0] : files.labelImage;

      if (!ineImage || !frontalImage || !labelImage) {
        return res.status(400).json({ errorMsg: 'Faltan imágenes requeridas' });
      }

      const result = await completeSaleDelivery({ 
        saleId,
        deliveryDate,
        deliveredBy: userId,
        ineImagePath: ineImage.filepath,
        ineImageName: ineImage.originalFilename,
        frontalImagePath: frontalImage.filepath,
        frontalImageName: frontalImage.originalFilename,
        labelImagePath: labelImage.filepath,
        labelImageName: labelImage.originalFilename,
        customerData
      });
      
      res.status(200).json({ msg: 'Entrega completada con éxito!', data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  } else {
    res.status(405).json({ errorMsg: 'Método no permitido' });
  }
}

export default handler;
