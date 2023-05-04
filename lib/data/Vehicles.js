import { connectToDatabase, isConnected } from "../db";
import { Vehicle } from "../models/Vehicle"

export async function getVehiclesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const vehicles = await Vehicle.find().populate([
    { 
      path: "operator",
      select:"name"
    }
  ]);
  return vehicles;
}
