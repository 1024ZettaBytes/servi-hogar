import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import { getTimeFromDate } from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Residence } from "../models/Residence";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { MachineMovement } from "../models/MachineMovement";
import { Vehicle } from "../models/Vehicle";
import { updateResidenceDataFunc } from "./Customers";
import { MACHINE_MOVEMENT_LIST } from "../consts/OBJ_CONTS";

Rent.init();
Residence.init();

export async function markCompleteDeliveryData({
  deliveryId,
  customerData,
  deliveredMachine,
  leftAccesories,
  isOk,
  files,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery || !(["ESPERA", "EN_CAMINO"].includes(delivery.status))) {
      error.message = "La entrega indicada no existe o no tiene estatus válido";
      throw error;
    }

    let rent = await Rent.findById(delivery.rent);
    if (rent.customer.toString() !== customerData._id) {
      error.message = "El cliente indicado no coincide";
      throw error;
    }

    let machine = await Machine.findOne({ machineNum: Number(deliveredMachine) }).populate("status").exec();
    if (!machine || machine.status?.id != "LISTO") {
      error.message = "El equipo indicado no esta disponible";
      throw error;
    }
    let customer = await Customer.findById(customerData?.id);
    let customerPrevRents = (await Rent.find({ customer: rent.customer }).populate("status").exec()).filter(r => r.status?.id === "FINALIZADA");
    const hasPrevRents = customerPrevRents && customerPrevRents.length > 0;
    if (!isOk.info) {
      if (hasPrevRents) {
        // TODO: check if was referred and modify
        customer = await new Customer({
          name: customerData.name,
          cell: customerData.cell,
          residences: [customerData.currentResidence],
          currentResidence: customerData.currentResidence,
          howFound: customerData.howFound,
          level: customerData.level,
          createdAt: currentDate,
          updatedAt: currentDate,
          lastUpdatedBy,
        }).save({ session, new: true });
      } else {
        customer.name = customerData.name;
        customer.cell = customerData.cell;
      }
    }
    if (!isOk.residence) {
      await updateResidenceDataFunc(session, customerData.currentResidence, error);
    }
    delivery.status = 'ENTREGADA';
    delivery.finishedAt = currentDate;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });


    const newRentMachineMov = await new MachineMovement({
      machine: newMachine,
      type: MACHINE_MOVEMENT_LIST.RENT,
      description: `Renta de ${rent.initialWeeks} semana(s)`,
      amount: -cost,
      date: currentDate,
    }).save({ session, new: true });

    machine.movements.push(newRentMachineMov);
    const rentMachineStatus = await MachineStatus.findOne({ id: "RENTADO" });
    machine.status = rentMachineStatus._id;
    machine.earnings = machine.earnings + rent.initialPay;
    machine.lastRent = rent;
    if (machine.currentWarehouse)
      machine.currentWarehouse = null;
    if (machine.currentVehicle) {
      let vehicle = await Vehicle.findById(machine.currentVehicle);
      const machines = vehicle?.machinesOn.filter(
        (machOn) => machOn.toString() !== machine._id.toString()
      );
      vehicle.machinesOn = machines;
      await vehicle.save({ session, new: false });
      machine.currentVehicle = null;
    }
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    rent.machine = machine;
    rent.customer = customer;
    const onRentStatus = await RentStatus.findOne({ id: "RENTADO" });
    rent.status = onRentStatus;
    rent.startDate = currentDate;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });


    const customerMovement = await new CustomerMovement({
      customer,
      rent: rent._id,
      type: "NEW_RENT",
      description: `Nueva renta de ${rent.initialWeeks} semana(s)`,
      date: currentDate,
    }).save({ session, new: true });

    customer.movements.push(customerMovement._id);

    if (rent.usedFreeWeeks> 1) {
      customer.freeWeeks = customer.freeWeeks - rent.usedFreeWeeks;
    }
    customer.hasRent = true;
    customer.currentRent = rent;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({session, new: false});
    await session.commitTransaction();
    await session.endSession();
  }
  catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al actualizar la entrega. Intente de nuevo."
      );
    }
  }
}
export async function updateDeliveryTimeData({
  deliveryId,
  deliveryTime,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery) {
      error.message = "No se encontró la entrega indicada.";
      throw error;
    }
    let date = new Date(deliveryTime.date);
    let fromTime = new Date(deliveryTime.date);
    let endTime = new Date(deliveryTime.date);
    if (deliveryTime.timeOption === "any") {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(deliveryTime.fromTime));
      const endT = getTimeFromDate(new Date(deliveryTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }
    delivery.date = date;
    delivery.timeOption = deliveryTime.timeOption;
    delivery.fromTime = fromTime;
    delivery.endTime = endTime;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al actualizar la entrega. Intente de nuevo."
      );
    }
  }
}

export async function getPendingDeliveriesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingDeliveries = await RentDelivery.find({
    status: { $in: ["ESPERA", "EN_CAMINO"] },
  })
    .populate("rent")
    .sort({ date: 1 })
    .exec();
  return pendingDeliveries;
}

export async function getDeliveryData(deliveryId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const delivery = await RentDelivery.findById(deliveryId)
    .populate([
      {
        path: "rent",
        populate: [
          {
            path: "customer",
            model: "customers",
            populate: {
              path: "currentResidence",
              model: "residences",
              populate: [
                {
                  path: "city",
                  model: "cities",
                  populate: {
                    path: "sectors",
                    model: "sectors",
                  },
                },
                {
                  path: "sector",
                  model: "sectors",
                },
              ],

            },
          },
        ],
      }
    ])
    .exec();
  return delivery;
}

export async function cancelDeliveryData({ deliveryId, lastUpdatedBy }) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery) {
      error.message = "No se encontró la entrega indicada.";
      throw error;
    }
    const cancelledStatus = await RentStatus.findOne({ id: "CANCELADA" });
    let rent = await Rent.findById(delivery.rent).populate();
    let customer = await Customer.findById(rent.customer);
    customer.hasRent = false;
    customer.currentRent = null;
    await customer.save({ session, new: false });

    rent.status = cancelledStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    delivery.status = "CANCELADA";
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al cancelar la entrega. Intente de nuevo."
      );
    }
  }
}