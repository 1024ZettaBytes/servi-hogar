import { connectToDatabase } from '../db';
import { Partner } from '../models/Partner';
import { Machine } from '../models/Machine';
import { MachineStatus } from '../models/MachineStatus';
import { Rent } from '../models/Rent';
import { RentStatus } from '../models/RentStatus';

import { MACHINE_STATUS_LIST } from '../consts/OBJ_CONTS';
import { dateDiffInDays, dateDiffInWeeks } from '../client/utils';
MachineStatus.init();
RentStatus.init();
Rent.init();

export async function getPartnerMachinesData(partnerUserId) {
  const currentDate = new Date();
  let machinesMap = {};
  await connectToDatabase();
  try {
    const currentPartner = await Partner.findOne({ user: partnerUserId })
      .select('_id payouts')
      .populate([
        { path: 'user', model: 'users', select: 'name' },
        { path: 'payouts', model: 'payouts', select: 'toPay machine' },
        {
          path: 'machines',
          model: 'machines',
          select: 'machineNum cost',
          populate: [
            { path: 'status', model: 'machine_statuses', select: 'id' },
            {
              path: 'lastRent',
              model: 'rents',
              select: 'startDate endDate',
              populate: [
                { path: 'status', model: 'rent_statuses', select: 'id' }
              ]
            }
          ]
        }
      ])
      .lean();
    for await (const machine of currentPartner.machines) {
      let rentWeeks = 0;
      let endDays = 0;
      let nextPay = 0;
      const isOnRent = machine.status.id === MACHINE_STATUS_LIST.RENTADO;
      const isOnChange = isOnRent && machine.lastRent.status.id === 'EN_CAMBIO';
      const isOnPickup =
        isOnRent && machine.lastRent.status.id === 'EN_RECOLECCION';
      if (isOnRent) {
        rentWeeks = dateDiffInWeeks(currentDate, machine.lastRent.startDate);
        nextPay = dateDiffInDays(currentDate, machine.lastRent.endDate);
        if (isOnPickup) {
          endDays = nextPay;
        }
      }

      machinesMap[machine._id] = {
        machineNum: machine.machineNum,
        isOnRent,
        isOnChange,
        isOnPickup,
        endDays,
        nextPay: nextPay >= 0 ? nextPay : 0,
        rentWeeks,
        cost: machine.cost,
        generated: 0
      };
    }

    currentPartner.payouts.forEach((payout) => {
      if (machinesMap[payout.machine]) {
        machinesMap[payout.machine].generated += payout.toPay;
      }
    });
    return { name: currentPartner.user.name, list: Object.values(machinesMap) };
  } catch (e) {
    console.log(e);
    throw new Error(
      'Ocurrió un error al consultar tus equipos, por favor contacta al administrador'
    );
  }
}

export async function assignMachineToPartnerData({ data }) {
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  
  session.startTransaction();
try {
    const assignments = Array.isArray(data) ? data : [data];
    const results = [];

    for (const assignment of assignments) {
      const { userId, machineId } = assignment;

      if (!userId || !machineId) {
        throw new Error('Se requiere userId y machineId en cada elemento');
      }

      const partner = await Partner.findOne({ user: userId }).session(session);
      if (!partner) {
        throw new Error(`No se encontró Partner para el usuario ${userId}`);
      }

      const machine = await Machine.findById(machineId).session(session);
      if (!machine) {
        throw new Error(`La máquina ${machineId} no existe`);
      }

      if (machine.partner && machine.partner.toString() !== partner._id.toString()) {
        throw new Error(`La máquina ${machine.machineNum} ya pertenece a otro socio.`);
      }

      await Partner.updateOne(
        { _id: partner._id },
        { $addToSet: { machines: machine._id } }
      ).session(session);

      machine.partner = partner._id;
      await machine.save({ session });

      results.push(`Máquina ${machine.machineNum} -> ${partner._id}`);
    }

    await session.commitTransaction();
    await session.endSession();

    return { 
      success: true, 
      msg: `Asignación completada. ${results.length} asignaciones realizadas.`,
      details: results
    };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(e.message || 'Ocurrió un error en la asignación masiva.');
    }
  }
}