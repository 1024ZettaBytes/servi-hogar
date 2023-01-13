import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { RentDelivery } from "../models/RentDelivery";
import {
  getTimeFromDate,
  getFileExtension,
  addDaysToDate,
  setDateToInitial,
  validateMapsUrl,
} from "../client/utils";
import { Rent } from "../models/Rent";
import { RentStatus } from "../models/RentStatus";
import { Customer } from "../models/Customer";
import { Residence } from "../models/Residence";
import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { MachineMovement } from "../models/MachineMovement";
import { Vehicle } from "../models/Vehicle";
import { CustomerLevel } from "../models/CustomerLevel";
import { CustomerMovement } from "../models/CustomerMovement";
import { Payment } from "../models/Payment";
import { updateResidenceDataFunc } from "./Customers";
import { MACHINE_MOVEMENT_LIST } from "../consts/OBJ_CONTS";
import { uploadFile } from "../cloud";
import { City } from "../models/City";
import { Sector } from "../models/Sector";
Rent.init();
Residence.init();
City.init();
Sector.init();

const getNextRentId = async () => {
  const rent = await Rent.findOne({}, {}, { sort: { num: -1 } });
  if (rent && rent.num && rent.num > 0) {
    return rent.num + 1;
  }
  return 1;
};

export async function markCompleteDeliveryData({
  deliveryId,
  customerData,
  payment,
  deliveredMachine,
  leftAccesories,
  isOk,
  files,
  deliveryDate,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery || !["ESPERA", "EN_CAMINO"].includes(delivery.status)) {
      error.message = "La entrega indicada no existe o no tiene estatus válido";
      throw error;
    }

    let rent = await Rent.findById(delivery.rent);
    if (rent.customer.toString() !== customerData._id) {
      error.message = "El cliente indicado no coincide";
      throw error;
    }

    let machine = await Machine.findOne({
      machineNum: Number(deliveredMachine),
    })
      .populate("status")
      .exec();
    if (!machine || !["LISTO", "REC"].includes(machine.status.id)) {
      error.message = "El equipo indicado no esta disponible";
      throw error;
    }
    let customer = await Customer.findById(customerData?._id);
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
    const maps = customerData?.currentResidence?.maps;
    if (!maps || !validateMapsUrl(maps)) {
      error.message =
        "Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)";
      throw error;
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
    delivery.finishedAt = deliveryDate;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });

    const newRentMachineMov = await new MachineMovement({
      machine,
      type: MACHINE_MOVEMENT_LIST.RENT,
      description: `Renta de ${rent.initialWeeks} semana(s)`,
      amount: rent.initialPay,
      date: deliveryDate,
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
    let forDebt = 0;
    if(payment > rent.initialPay){
      forDebt = payment - rent.initialPay;
    }
    let endDate = addDaysToDate(deliveryDate, rent.initialWeeks * 7);
    endDate = setDateToInitial(endDate);
    rent.machine = machine;
    rent.customer = customer;
    rent.accesories = leftAccesories;
    const onRentStatus = await RentStatus.findOne({ id: "RENTADO" });
    rent.status = onRentStatus;
    rent.startDate = deliveryDate;
    rent.initialPay = payment;
    rent.endDate = endDate;
    rent.updatedAt = currentDate;
    rent.totalWeeks = rent.initialWeeks;
    rent.lastUpdatedBy = lastUpdatedBy;
    rent.num = await getNextRentId();
    const payments = await Payment.find();
    await new Payment({
      number: payments.length + 1,
      amount: payment,
      customer: rent.customer,
      reason: "INICIO",
      description: `Inicio de renta ${rent.initialWeeks} semana(s)`,
      method: "CASH",
      date: deliveryDate,
      lastUpdatedBy,
    }).save({ session, new: true });
   
    const customerMovement = await new CustomerMovement({
      customer,
      rent: rent._id,
      type: "NEW_RENT",
      description: `Nueva renta de ${rent.initialWeeks} semana(s)`,
      date: deliveryDate,
    }).save({ session, new: true });

    customer.movements.push(customerMovement._id);
    if(forDebt > 0){
      const customerMovementDebt = await new CustomerMovement({
        customer,
        rent: rent._id,
        type: "DEBT",
        description: `Abono de $${forDebt}`,
        date: deliveryDate,
      }).save({ session, new: true });
      customer.movements.push(customerMovementDebt._id);
    }
    if (isOk.info && rent.usedFreeWeeks > 0) {
      customer.freeWeeks = customer.freeWeeks - rent.usedFreeWeeks;
    }
    customer.hasRent = true;
    customer.balance = customer.balance + forDebt;
    customer.totalRentWeeks = customer.totalRentWeeks + rent.initialWeeks;
    customer.currentRent = rent;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;

    if (customer.wasReferred) {
      referredByCustomer.freeWeeks = referredByCustomer.freeWeeks + 1;
      await referredByCustomer.save({ session, new: false });
    }
    await customer.save({ session, new: false });
    // Save attachments on cloud and
    let imagesUrl = {};
    for (const [key] of Object.entries(files)) {
      const fileName = `${key}_${rent.num}.${getFileExtension(
        files[key].originalFilename
      )}`;
      const url = await uploadFile(files[key].filepath, fileName);
      imagesUrl[key] = url;
    }
    rent.imagesUrl = imagesUrl;
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
    .populate({
      path: "rent",
      populate: {
        path: "customer",
        populate: "currentResidence",
      },
    })
    .sort({ date: 1 })
    .exec();
  return pendingDeliveries;
}

export async function getPastDeliveriesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pastDeliveries = await RentDelivery.find({
    status: { $in: ["ENTREGADA", "CANCELADA"] },
  })
    .populate({
      path: "rent",
      populate: {
        path: "customer",
        populate: "currentResidence",
      },
    })
    .sort({ updatedAt: -1 })
    .exec();
  return pastDeliveries;
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
      },
    ])
    .exec();
  return delivery;
}

export async function cancelDeliveryData({
  deliveryId,
  cancellationReason,
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
    const cancelledStatus = await RentStatus.findOne({ id: "CANCELADA" });
    let rent = await Rent.findById(delivery.rent);
    let customer = await Customer.findById(rent.customer);
    customer.hasRent = false;
    customer.currentRent = null;
    await customer.save({ session, new: false });

    rent.status = cancelledStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    delivery.status = "CANCELADA";
    delivery.cancellationReason = cancellationReason;
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
