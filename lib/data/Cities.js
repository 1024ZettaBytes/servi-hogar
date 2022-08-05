import { connectToDatabase, isConnected } from "../db";
import { City } from "../models/City";
import { Sector } from "../models/Sector";
export async function getCitiesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const cities =  await City.find({}).populate("sectors").exec();
  return cities;
}

