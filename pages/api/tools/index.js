import { connectToDatabase, isConnected } from '../../../lib/db';
import { Machine } from '../../../lib/models/Machine';
import { Partner } from '../../../lib/models/Partner';
import { Sale } from '../../../lib/models/Sale';
import { SalesMachine } from '../../../lib/models/SalesMachine';
import { SaleDelivery } from '../../../lib/models/SaleDelivery';
import { addDays } from 'date-fns';
import { set } from 'nprogress';
import { setDateToEnd } from '../../../lib/client/utils';

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

async function setWarrantyDate(req, res) {
  try {
    await connectToDatabase();
    const sales = await Sale.find();
    for (const sale of sales) {
      const delivery = await SaleDelivery.findOne({ sale: sale._id });
      if (!delivery || delivery.isRepairReturn) {
        console.log(`No delivery found for sale ${sale.saleNum}`);
        continue;
      }
      if(delivery.status !== "COMPLETADA") continue;

      let machine = await SalesMachine.findById(sale.machine);
      if(!machine){
        machine = await Machine.findById(sale.machine);
      }

      const saleDate = sale.saleDate;
      if(machine.isFromRent){
        machine.warranty = addDays(setDateToEnd(saleDate), 90);
      }
      else{
        machine.warranty = addDays(setDateToEnd(saleDate), 180);
      }
      await machine.save();
    }
    res.status(200).json({ message: "Warranty dates updated successfully" });

  } catch (e) {
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      await setWarrantyDate(req, res);
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
