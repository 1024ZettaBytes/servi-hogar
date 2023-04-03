import { connectToDatabase, isConnected } from "../db";
import { City } from "../models/City";
import { Sector } from "../models/Sector";
Sector.init();
export async function getCitiesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const cities =  await City.find({}).populate("sectors").lean();
  return cities;
}

