import {
  dateDiffInDays,
} from '../client/utils';
import { connectToDatabase, isConnected } from '../db';
import { City } from '../models/City';
import { Rent } from '../models/Rent';
import { Residence } from '../models/Residence';
import { Sector } from '../models/Sector';
import { User } from '../models/User';

import { Mantainance } from '../models/Mantainance';
import { MachineStatus } from '../models/MachineStatus';
import { MACHINE_STATUS_LIST } from '../consts/OBJ_CONTS';
import { Machine } from '../models/Machine';
Rent.init();
Residence.init();
City.init();
Sector.init();

export const getNextMantId = async () => {
  const mant = await Mantainance.findOne({}, {}, { sort: { num: -1 } });
  if (mant && mant.totalNumber && mant.totalNumber > 0) {
    return mant.totalNumber + 1;
  }
  return 1;
};

export async function completeMantainanceData({
  mantainanceId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let mantainance = await Mantainance.findById(mantainanceId);
    if (!mantainance) {
      error.message = 'No se encontró el mantenimiento indicado.';
      throw error;
    }
    mantainance.status = 'FINALIZADO';
    mantainance.finishedAt = currentDate;
    mantainance.updatedAt = currentDate;
    mantainance.lastUpdatedBy = lastUpdatedBy;

    await session.startTransaction();

    await mantainance.save({ session, new: false });

    const machine = await Machine.findById(mantainance.machine);
    const readyStatus =  await MachineStatus.findOne({id: MACHINE_STATUS_LIST.LISTO });
    machine.status = readyStatus._id;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar el mantenimiento. Intente de nuevo.'
      );
    }
  }
}

export async function getMantData(userId, pending=false) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const user = await User.findById(userId).populate('role').lean();
  let filter = { status: { $in: pending ? ['PENDIENTE', 'EN_PROGRESO']: ['FINALIZADO'] } };
  if (user.role.id === 'TEC') {
    filter.takenBy = userId;
  }
  const pendingMantainances = await Mantainance.find(filter)
    .populate([
      { path: 'takenBy', select: '_id name' },
      {
        path: 'machine',
        select: '_id machineNum'
      }
    ])
    .sort({ updatedAt: 1 })
    .lean();
if(pending){
  for(let i in pendingMantainances){
    const creationDate = new Date(pendingMantainances[i].createdAt);
    pendingMantainances[i].daysSinceCreate = dateDiffInDays(creationDate, new Date());
  }
}
  return pendingMantainances;
}
