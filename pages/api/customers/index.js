import { connectToDatabase } from "../../../lib/db";
import { Customer } from "../../../lib/models/Customer";
async function handler(req, res) {
  if (req.method !== "POST") {
    return;
  }

  const customerData = req.body;
  const { curp } = req.body;

  const client = await connectToDatabase();

  const existingCustomer = await Customer.findOne({ curp });
  if (existingCustomer) {
    res.status(422).json({ ok: false, message: "Ya existe un cliente con la CURP ingresada" });
    client.disconnect();
    return;
  }
  const newCustomer = new Customer({...customerData});
  await newCustomer.save();
  res.status(200).json({ ok: true, message: "Cliente guardado con exito" })
  client.disconnect();
}

export default handler;
