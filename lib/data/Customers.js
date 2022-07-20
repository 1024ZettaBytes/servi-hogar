import { connectToDatabase } from "../db";
import { Customer } from "../models/Customer";
export async function getCustomers() {
  const client = await connectToDatabase();
  const costumers = await Customer.find({});
  const costumerList = costumers.map((doc) => {
    const costumer = doc.toObject()
    costumer._id = null;
    return costumer;
  });
  client.disconnect();
  return costumerList;
}
