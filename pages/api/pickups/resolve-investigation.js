import { resolveInvestigation } from '../../../lib/data/Pickups';
import { validateUserPermissions, getUserId } from '../auth/authUtils';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ['ADMIN', 'AUX']);
  if (!validRole) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ errorMsg: 'Método no permitido' });
  }

  try {
    const userId = await getUserId(req);
    const form = formidable({ multiples: false });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Extract values properly based on formidable v3 format
    const pickupId = Array.isArray(fields.pickupId) ? fields.pickupId[0] : fields.pickupId;
    const statusId = Array.isArray(fields.statusId) ? fields.statusId[0] : fields.statusId;
    const locationType = Array.isArray(fields.locationType) ? fields.locationType[0] : fields.locationType;
    const locationId = Array.isArray(fields.locationId) ? fields.locationId[0] : fields.locationId;
    const reason = Array.isArray(fields.reason) ? fields.reason[0] : fields.reason;

    // The file object
    const file = files.file?.[0] || files.file;

    if (!pickupId || !statusId || !locationType || !locationId || !reason || !file) {
      return res.status(400).json({ errorMsg: 'Faltan campos obligatorios o fotografía' });
    }

    const result = await resolveInvestigation(
      pickupId,
      statusId,
      locationType,
      locationId,
      reason,
      file,
      userId
    );

    res.status(200).json({ message: 'Investigación resuelta con éxito', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: error.message || 'Error al resolver la investigación' });
  }
}
