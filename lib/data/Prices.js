import { connectToDatabase, isConnected } from "../db";
import { Prices } from "../models/Prices"

export async function getPricesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const prices = await Prices.findOne();
  return prices;
}
