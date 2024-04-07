import { connectToDatabase } from '../db';
import { Machine } from '../models/Machine';
import { Residence } from '../models/Residence';
import { getFileExtension } from '../client/utils';
import { Payout } from '../models/Payout';
import { PAYOUT_KEYS } from '../consts/OBJ_CONTS';
import { uploadFile } from '../cloud';
import { Partner } from '../models/Partner';
Machine.init();
Residence.init();

export async function updatePayoutData({ _id, files, status, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  await connectToDatabase();
  try {
    if (!files) {
      error.message = 'Agregue la imagen del comprobante';
      throw error;
    }
    if (status !== PAYOUT_KEYS.COMPLETED) {
      error.message = 'Status indicado incorrecto';
      throw error;
    }

    const fileName = `payout_${Date.now()}.${getFileExtension(
      files.file.originalFilename
    )}`;
    const voucherUrl = await uploadFile(files.file.filepath, fileName);
    let currentPayout = await Payout.findById(_id);
    if (!currentPayout || currentPayout.status !== PAYOUT_KEYS.PENDING) {
      error.message = 'El pago indicado no es válido';
      throw error;
    }
    currentPayout.status = PAYOUT_KEYS.COMPLETED;
    currentPayout.completedAt = currentDate;
    currentPayout.lastUpdatedBy = lastUpdatedBy;
    currentPayout.voucherUrl = voucherUrl;
    await currentPayout.save();
  } catch (e) {
    console.error(e);
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrío un error al completar el pago. Intente de nuevo.'
      );
    }
  }
}

export async function getPayoutsData(userRole = null, userId = null) {
  await connectToDatabase();
  let partnerFilter = {};
  if (userRole === 'PARTNER' && userId) {
    const currentPartner = await Partner.findOne({ user: userId })
      .select('_id')
      .lean();
    partnerFilter = { partner: currentPartner._id };
  }
  const payoutsList = await Payout.find(partnerFilter)
    .populate([
      {
        path: 'partner',
        select: 'user',
        model: 'partners',
        populate: {
          path: 'user',
          select: 'name',
          model: 'users'
        }
      },
      {
        path: 'machine',
        select: 'machineNum',
        model: 'machines'
      }
    ])
    .sort({ createdAt: -1 })
    .lean();

  return payoutsList;
}
