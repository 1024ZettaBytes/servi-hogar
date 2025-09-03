import { connectToDatabase, isConnected } from '../db';
import { getMachinesReportData } from './Machines';
import { Record } from '../models/Record';
import { Rent } from '../models/Rent';
import { RentStatus } from '../models/RentStatus';
import { dateDiffInDays, setDateToEnd, setDateToMid } from '../client/utils';
import { Role } from '../models/Role';
import { savePickupData } from './Pickups';

async function createPickupsForRents() {
  const onRentStatus = await RentStatus.findOne({ id: 'RENTADO' });
  const yesterdayDate = setDateToEnd(new Date()).setDate(
    new Date().getDate() - 1
  );
  const rentsToPickup = await Rent.find({
    status: onRentStatus._id,
    endDate: { $lte: yesterdayDate }
  });
  const rentsWithDiff = rentsToPickup.filter(
    (rent) =>
      dateDiffInDays(new Date(rent.startDate), new Date(rent.endDate)) < 30
  );
  if (rentsWithDiff.length === 0) {
    console.log('INFO: No hay rentas a recoger con menos de 30 días.');
    return;
  }
  console.log('INFO: Rentas a recoger con menos de 30 días: ', rentsWithDiff.length);
  const systemRole = await Role.findOne({ id: 'SYSTEM' });
  for (let rent of rentsWithDiff) {
    await savePickupData({
      rentId: rent._id,
      lastUpdatedBy: systemRole._id,
      reason: "SISTEMA: vencida",
      pickupTime: {
        date: setDateToMid(new Date()),
        timeOption: "any"
      }
    });
    console.log('Recogida programada para la renta: ', rent.num);
  }
}

export async function generateRecordData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const report = await getMachinesReportData();
  await new Record({ id, date: new Date(), _record: report }).save();
  await createPickupsForRents(report);
}

export async function getLastRecordData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const record = await Record.findOne({ id }).sort({ date: -1 }).lean();
  return record || null;
}
