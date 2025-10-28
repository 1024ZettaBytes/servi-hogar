import { connectToDatabase, isConnected } from '../../../lib/db';
import { Machine } from '../../../lib/models/Machine';
import { Partner } from '../../../lib/models/Partner';

async function partnerAssign(req, res) {
  try {
    const machinesId = [372, 407];
    const partnerId = '66130096963d8ffeab04af16';
    if (!isConnected()) {
          await connectToDatabase();
        }
    let partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ errorMsg: 'Partner not found' });
    }
    partner.machines = [];

    for (const machineNum of machinesId) {
      let machine = await Machine.findOne({ machineNum});
      if (!machine) {
        return res.status(404).json({ errorMsg: 'Machine not found' });
      }
      machine.partner = partner._id;
      await machine.save();
      partner.machines.push(machine._id);
    }
    /*
    console.log('partner', partner);
    let machines = await Machine.findOne({ machineNumber: { $in: machinesId } });
    if (!machines) {
      return res.status(404).json({ errorMsg: 'Machines not found' });
    }
    for(let i in machines) {
    machines[i].partner = partner._id;
    await machines[i].save();
    partner.machines.push(machines[i]._id);
    }
        */
    await partner.save();

    res.status(200).json({ message: "Machines assigned for partner" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await partnerAssign(req, res);
      break;
    case 'POST':
      break;
    case 'PUT':
      break;
    case 'DELETE':
      break;
  }
}

export default handler;
