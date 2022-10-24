import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { Rent } from "../models/Rent";
import { Customer } from "../models/Customer";
import { RentStatus } from "../models/RentStatus";
import { RentDelivery } from "../models/RentDelivery";
import { Prices } from "../models/Prices";
import {Machine } from "../models/Machine";
import { Residence } from "../models/Residence";
import {getTimeFromDate} from "../client/utils";
Machine.init();
Residence.init();
const getNextRentId = async () => {
  const rent = await Rent.findOne({}, {}, { sort: { num: -1 } });
  if (rent && rent.num) {
    return rent.num + 1;
  }
  return 1;
};

export async function saveRentData({
  customerId,
  rentPeriod,
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
    // Check if the customer  does not have a current rent
    let customer = await Customer.findById(customerId)
      .populate("currentResidence")
      .exec();
    if (!customer || customer.hasRent) {
      error.message = "El cliente indicado no es válido";
      throw error;
    }
    // Create Rent
    const rentStatus = await RentStatus.findOne({ id: "PENDIENTE" });
    const { weekPrice } = await Prices.findOne();
    let weeksToPay = rentPeriod.selectedWeeks;
    if (customer.freeWeeks > 0 && rentPeriod.useFreeWeeks) {
      weeksToPay =
        customer.freeWeeks <= rentPeriod.selectedWeeks
          ? rentPeriod.selectedWeeks - customer.freeWeeks
          : 0;
    }
    let usedFreeWeeks = 0;
    if (rentPeriod.useFreeWeeks) {
      usedFreeWeeks =
        rentPeriod.selectedWeeks >= customer.freeWeeks
          ? customer.freeWeeks
          : rentPeriod.selectedWeeks;
    }


    const initialPay = weeksToPay * weekPrice;
    let rent = await new Rent({
      num: await getNextRentId(),
      status: rentStatus,
      customer,
      usedFreeWeeks,
      initialWeeks: rentPeriod.selectedWeeks,
      initialPay,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy,
    }).save({ session, new: true });
    
    customer.hasRent = true;
    customer.currentRent = rent._id;
    await customer.save({ session, new: false });
    let date = new Date(deliveryTime.date);
    let fromTime = new Date(deliveryTime.date);
    let endTime = new Date(deliveryTime.date);
    if (deliveryTime.timeOption === "any") {
      date.setHours(23,59,59,0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22,0,0,0);
    }else{
      const fromT = getTimeFromDate(new Date(deliveryTime.fromTime));
      const endT = getTimeFromDate(new Date(deliveryTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds,0)
      date = fromTime;
    }
    await new RentDelivery({
      rent,
      date,
      timeOption: deliveryTime.timeOption,
      fromTime,
      endTime,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });
    await session.commitTransaction();
    await session.endSession();
    return rent;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrío un error al guardar la renta. Intente de nuevo."
      );
    }
  }
}

export async function getPendingRentsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pendingRents = await RentDelivery.find({status: {$in:["ESPERA", "EN_CAMINO"]}}).
  populate("rent")
    .sort({ date: 1 })
    .exec();
  return pendingRents;
}

export async function getRentsWithLocations() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const validStatuses = await RentStatus.find({id: {$in:["RENTADO", "EN_CAMBIO", "EN_RECOLECCION", "VENCIDA"]}});
  const validIds = validStatuses.reduce((prev, curr)=>{
    prev.push(curr._id);
    return prev; 
  }, []);
  const currentRents = await Rent.find({status: {$in: validIds }}).populate([{
    path: "customer",
      model: "customers",
      populate: {
        path: "currentResidence",
        model: "residences",
      },
  }, {
    path: "machine",
    model: "machines",
  }]).exec();
  
  return currentRents;
}
