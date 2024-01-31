import { connectToDatabase, isConnected } from '../db';
import { getMachinesReportData } from './Machines';
import { Record } from '../models/Record';

export async function generateRecordData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const report = await getMachinesReportData();
  await new Record({ id, date: new Date(), _record: report }).save();
}

export async function getLastRecordData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const record = await Record.findOne({ id }).sort({ date: -1 }).lean();
  return record || null;
}
