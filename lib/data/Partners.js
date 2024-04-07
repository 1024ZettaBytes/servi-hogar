import { connectToDatabase } from '../db';
import { Partner } from '../models/Partner';
import { MachineStatus } from '../models/MachineStatus';
import { Rent } from '../models/Rent';

import { MACHINE_STATUS_LIST } from '../consts/OBJ_CONTS';
import { dateDiffInWeeks } from '../client/utils';
MachineStatus.init();
Rent.init();
export async function getPartnerMachinesData(partnerUserId) {
  const currentDate = new Date();
  let machinesMap = {};
  await connectToDatabase();
  try {
    const currentPartner = await Partner.findOne({ user: partnerUserId })
      .select('_id payouts')
      .populate([
        { path: 'payouts', model: 'payouts', select: 'toPay machine' },
        {
          path: 'machines',
          model: 'machines',
          select: 'machineNum cost',
          populate: [
            { path: 'status', model: 'machine_statuses', select: 'id' },
            { path: 'lastRent', model: 'rents', select: 'startDate' }
          ]
        }
      ])
      .lean();
    currentPartner.machines.forEach((machine) => {
      let rentWeeks = 0;
      const isOnRent = machine.status.id === MACHINE_STATUS_LIST.RENTADO;
      if (isOnRent) {
        console.log();
        rentWeeks = dateDiffInWeeks(currentDate, machine.lastRent.startDate);
      }
      machinesMap[machine._id] = {
        machineNum: machine.machineNum,
        isOnRent,
        rentWeeks,
        cost: machine.cost,
        generated: 0
      };
    });

    currentPartner.payouts.forEach((payout) => {
      if (machinesMap[payout.machine]) {
        machinesMap[payout.machine].generated += payout.toPay;
      }
    });
    return Object.values(machinesMap);
  } catch (e) {
    console.log(e);
    throw new Error(
      'Ocurrió un error al consultar tus equipos, por favor contacta al administrador'
    );
  }
}
