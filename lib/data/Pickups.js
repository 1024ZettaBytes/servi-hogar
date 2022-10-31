import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import {
  getTimeFromDate,
  getFileExtension,
  addDaysToDate,
  setDateToInitial,
} from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Residence } from "../models/Residence";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { RentPickup } from "../models/RentPickup";
import { Vehicle } from "../models/Vehicle";
import { CustomerLevel } from "../models/CustomerLevel";
import { CustomerMovement } from "../models/CustomerMovement";
import { updateResidenceDataFunc } from "./Customers";
import { MACHINE_MOVEMENT_LIST } from "../consts/OBJ_CONTS";
import { uploadFile } from "../cloud";

export async function savePickupData({
  rentId,
  pickupTime,
  lastUpdatedBy
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
    let rent = await Rent.findById(rentId).populate("status");
    if (!rent || !(["RENTADO", "VENCIDA"].includes(rent.status.id))) {
      error.name = "La renta indicada no es válida";
      throw error
    }
    const onPickupStatus = await RentStatus.findOne({ id: "EN_RECOLECCION" });
    rent.status = onPickupStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    let date = new Date(pickupTime.date);
    let fromTime = new Date(pickupTime.date);
    let endTime = new Date(pickupTime.date);
    if (pickupTime.timeOption === "any") {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(pickupTime.fromTime));
      const endT = getTimeFromDate(new Date(pickupTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }

    await new RentPickup({
      rent,
      date,
      timeOption: pickupTime.timeOption,
      fromTime,
      endTime,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });
    
    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrió un error al guardar la recolección. Intente de nuevo."
      );
    }
  }
}
export async function getPendingPickupsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingPickups = await RentPickup.find({
    status: { $in: ["ESPERA", "EN_CAMINO", "EN_DOMICILIO"] },
  })
    .populate({path:"rent", populate: "customer"})
    .sort({ date: 1 })
    .exec();
  return pendingPickups;
}

export async function getPickupData(deliveryId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pickup = await RentPickup.findById(deliveryId)
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
          "machine"
        ],
      },
    ])
    .exec();
  return pickup;
}

export async function markCompletePickupData({
  pickupId,
  pickedAccesories,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let pickup = await RentPickup.findById(pickupId);
    if (!pickup || !["ESPERA", "EN_CAMINO"].includes(pickup.status)) {
      error.message = "La recolección indicada no existe o no tiene estatus válido";
      throw error;
    }

    let rent = await Rent.findById(pickup.rent);
    let customer = await Rent.findById(rent.customer);
    let machine = await Machine.findById(rent.machine)
      .populate("status")
      .exec();
    if (!machine || machine.status?.id != "LISTO") {
      error.message = "El equipo indicado no esta disponible";
      throw error;
    }
   
customer.hasRent = false;
customer.currentRent = null;
customer.updatedAt = currentDate;
customer.lastUpdatedBy = lastUpdatedBy;
await customer.save({session, new: false});


    let customerPrevRents = (
      await Rent.find({ customer: rent.customer }).populate("status").exec()
    ).filter((r) => r.status?.id === "FINALIZADA");
    const hasPrevRents = customerPrevRents && customerPrevRents.length > 0;
    let referredByCustomer = customer.wasReferred
      ? await Customer.findById(customer.referredBy)
      : null;
    if (!isOk.info) {
      if (hasPrevRents) {
        const existingCust = await Customer.findOne({
          cell: customerData.cell,
        });
        if (rent.usedFreeWeeks > 0) {
          // Remove free weeks from original customer
          customer.freeWeeks = customer.freeWeeks - rent.usedFreeWeeks;
          await customer.save({ session, new: false });
        }
        if (existingCust) {
          customer = existingCust;
        } else {
          const newCustomerLevel = await CustomerLevel.findOne({ id: "nuevo" });
          customer = await new Customer({
            name: customerData.name,
            cell: customerData.cell,
            residences: [customer.currentResidence],
            currentResidence: customer.currentResidence,
            howFound: customer.howFound,
            referredBy: customer.referredBy,
            wasReferred: customer.wasReferred,
            level: newCustomerLevel,
            createdAt: currentDate,
            updatedAt: currentDate,
            lastUpdatedBy,
          }).save({ session, new: true });
          if (customer.wasReferred) {
            referredBy.referrals.push(customer._id);
          }
        }
      } else {
        customer.name = customerData.name;
        customer.cell = customerData.cell;
      }
    }
    if (!isOk.residence) {
      await updateResidenceDataFunc(
        session,
        customerData.currentResidence,
        error
      );
    }
    delivery.status = "ENTREGADA";
    delivery.leftAccesories = leftAccesories;
    delivery.finishedAt = currentDate;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });

    const newRentMachineMov = await new MachineMovement({
      machine,
      type: MACHINE_MOVEMENT_LIST.RENT,
      description: `Renta de ${rent.initialWeeks} semana(s)`,
      amount: rent.initialPay,
      date: currentDate,
    }).save({ session, new: true });

    machine.movements.push(newRentMachineMov);
    const rentMachineStatus = await MachineStatus.findOne({ id: "RENTADO" });
    machine.status = rentMachineStatus._id;
    machine.earnings = machine.earnings + rent.initialPay;
    machine.lastRent = rent;
    if (machine.currentWarehouse) machine.currentWarehouse = null;
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
    let endDate = addDaysToDate(currentDate, rent.initialWeeks * 7);
    endDate = setDateToInitial(endDate);
    rent.machine = machine;
    rent.customer = customer;
    rent.accesories = leftAccesories;
    const onRentStatus = await RentStatus.findOne({ id: "RENTADO" });
    rent.status = onRentStatus;
    rent.startDate = currentDate;
    rent.endDate = endDate;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;

    const customerMovement = await new CustomerMovement({
      customer,
      rent: rent._id,
      type: "NEW_RENT",
      description: `Nueva renta de ${rent.initialWeeks} semana(s)`,
      date: currentDate,
    }).save({ session, new: true });

    customer.movements.push(customerMovement._id);

    if (isOk.info && rent.usedFreeWeeks > 1) {
      customer.freeWeeks = customer.freeWeeks - rent.usedFreeWeeks;
    }
    customer.hasRent = true;
    customer.currentRent = rent;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;

    if (customer.wasReferred) {
      referredByCustomer.freeWeeks = referredByCustomer.freeWeeks + 1;
      await referredByCustomer.save({ session, new: false });
    }
    await customer.save({ session, new: false });
    let fileName = `contract_${rent.num}.${getFileExtension(
      files.file.originalFilename
    )}`;
    const contractUrl = await uploadFile(files.file.filepath, fileName);
    rent.contractUrl = contractUrl;
    await rent.save({ session, new: false });
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