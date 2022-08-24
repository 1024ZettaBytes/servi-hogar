import { connectToDatabase, isConnected } from "../db";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";

export async function getMachinesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await Machine.find({ active: true })
    .populate(["status"//"movements", "lastRent"
  ])
    .exec();
  return machines;
}

export async function getMachineStatusData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await MachineStatus.find();
  return machines;
}
