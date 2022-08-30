import { connectToDatabase, isConnected } from "../db";
import { City } from "../models/City";
import { Warehouse } from "../models/Warehouse";

City.init();

export async function getWarehousesOverviewData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const warehouses = await Warehouse.find();
  return warehouses;
}
export async function getWarehousesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const warehouses = await Warehouse.find().populate(["city"]).exec();
  return warehouses;
}
