import { connectToDatabase } from '../db';
import { Partner } from '../models/Partner';
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
