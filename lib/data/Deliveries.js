import mongoose from 'mongoose';
import {
  addDaysToDate,
  dateFromString,
  getFileExtension,
  getTimeFromDate,
  machineCalculations,
  setDateToEnd,
  setDateToInitial,
  setDateToMid,
  validateMapsUrl
} from '../client/utils';
import { uploadFile } from '../cloud';
import { MACHINE_MOVEMENT_LIST, PAYOUT_KEYS } from '../consts/OBJ_CONTS';
import { connectToDatabase, isConnected } from '../db';
import { City } from '../models/City';
import { Customer } from '../models/Customer';
import { CustomerLevel } from '../models/CustomerLevel';
import { CustomerMovement } from '../models/CustomerMovement';
import { Machine } from '../models/Machine';
import { MachineMovement } from '../models/MachineMovement';
import { MachineStatus } from '../models/MachineStatus';
import { Partner } from '../models/Partner';
import { Payment } from '../models/Payment';
import { Payout } from '../models/Payout';
import { Prices } from '../models/Prices';
import { Rent } from '../models/Rent';
import { RentDelivery } from '../models/RentDelivery';
import { RentStatus } from '../models/RentStatus';
import { Residence } from '../models/Residence';
import { Sector } from '../models/Sector';
import { User } from '../models/User';
import { Vehicle } from '../models/Vehicle';
import { updateResidenceDataFunc } from './Customers';
import { getLastRentByCustomerId } from './Rents';
import { checkAndBlockOperator } from './Users';
import { generateReceipt } from './Receipts';
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
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery || !['ESPERA', 'EN_CAMINO'].includes(delivery.status)) {
      error.message = 'La entrega indicada no existe o no tiene estatus válido';
      throw error;
    }

    let rent = await Rent.findById(delivery.rent);
    if (rent.customer.toString() !== customerData._id) {
      error.message = 'El cliente indicado no coincide';
      throw error;
    }

    let machine = await Machine.findOne({
      machineNum: Number(deliveredMachine)
    })
      .populate('status')
      .exec();
    if (!machine || !['LISTO', 'REC', 'VEHI'].includes(machine.status.id)) {
      error.message = 'El equipo indicado no esta disponible';
      throw error;
    }
    let customer = await Customer.findById(customerData?._id);

    let customerPrevRents = (
      await Rent.find({ customer: rent.customer }).populate('status').lean()
    ).filter((r) => r.status?.id === 'FINALIZADA');
    const hasPrevRents = customerPrevRents && customerPrevRents.length > 0;
    let referredByCustomer = customer.wasReferred
      ? await Customer.findById(customer.referredBy)
      : null;

    await session.startTransaction();

    if (!isOk.info) {
      if (hasPrevRents) {
        const existingCust = await Customer.findOne({
          cell: customerData.cell
        });
        if (rent.usedFreeWeeks > 0) {
          // Remove free weeks from original customer
          customer.freeWeeks = customer.freeWeeks - rent.usedFreeWeeks;
          await customer.save({ session, new: false });
        }

        if (existingCust) {
          customer = existingCust;
        } else {
          const newCustomerLevel = await CustomerLevel.findOne({
            id: 'regular'
          });
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
            lastUpdatedBy
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
        'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
      throw error;
    }

    if (!isOk.residence) {
      await updateResidenceDataFunc(
        session,
        customerData.currentResidence,
        error
      );
    }
    
    // Check if operator should be blocked BEFORE saving the completion
    if (delivery.operator) {
      await checkAndBlockOperator(delivery.operator, new Date(currentDate), session);
    }
    
    delivery.status = 'ENTREGADA';
    delivery.leftAccesories = leftAccesories;
    delivery.finishedAt = currentDate;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });
    
    const generated = payment >= rent.initialPay ? rent.initialPay : payment;

    const newRentMachineMov = await new MachineMovement({
      machine,
      type: MACHINE_MOVEMENT_LIST.RENT,
      description: `Renta de ${rent.initialWeeks} semana(s)`,
      amount: generated,
      date: currentDate
    }).save({ session, new: true });

    machine.movements.push(newRentMachineMov);
    const rentMachineStatus = await MachineStatus.findOne({ id: 'RENTADO' });
    machine.status = rentMachineStatus._id;
    machine.earnings = machine.earnings + generated;
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

    if (machine.partner) {
      let incomeAmount;
      const { newWeekPrice, twoWeekPrice, threeWeekPrice } =
        await Prices.findOne().lean();
      const prices = {
        1: newWeekPrice,
        2: twoWeekPrice,
        3: threeWeekPrice,
        4: threeWeekPrice
      };
      incomeAmount = prices[rent.initialWeeks];
      const {
        mantainance,
        mantPercentage,
        comision,
        comisionPercentage,
        toPay
      } = machineCalculations(
        rent.initialWeeks > 1 ? incomeAmount - newWeekPrice : 0,
        currentDate,
        machine.createdAt
      );
      let currentPartner = await Partner.findById(machine.partner);

      const newPayout = await new Payout({
        type: PAYOUT_KEYS.NEW,
        incomeAmount,
        placement: newWeekPrice,
        mantainance,
        mantainancePercentage: mantPercentage,
        comision,
        comisionPercentage,
        toPay,
        status: toPay > 0 ? PAYOUT_KEYS.PENDING : PAYOUT_KEYS.NA,
        machine: machine._id,
        partner: machine.partner,
        createdAt: currentDate,
        lastUpdatedBy: lastUpdatedBy
      }).save({ session, isNew: true });
      currentPartner.payouts.push(newPayout);
      await currentPartner.save({ session, isNew: false });
    }
    await machine.save({ session, new: false });
    let forDebt = 0;
    if (payment > rent.initialPay) {
      forDebt = payment - rent.initialPay;
    }
    let endDate = addDaysToDate(currentDate, rent.initialWeeks * 7);
    endDate = setDateToMid(endDate);
    rent.machine = machine;
    rent.customer = customer;
    rent.accesories = leftAccesories;
    const onRentStatus = await RentStatus.findOne({ id: 'RENTADO' });
    rent.status = onRentStatus;
    rent.startDate = currentDate;
    rent.initialPay = payment;
    rent.endDate = endDate;
    rent.updatedAt = currentDate;
    rent.totalWeeks = rent.initialWeeks;
    rent.lastUpdatedBy = lastUpdatedBy;
    rent.num = await getNextRentId();
    const lastPayment = await Payment.findOne()
      .sort({ number: -1 })
      .select('number')
      .lean();
    const newPayment = await new Payment({
      number: lastPayment ? lastPayment.number + 1 : 1,
      amount: payment,
      customer: rent.customer,
      reason: 'INICIO',
      description: `Inicio de renta ${rent.initialWeeks} semana(s)`,
      weeksToPay: rent.initialWeeks,
      method: 'CASH',
      date: currentDate,
      lastUpdatedBy
    }).save({ session, isNew: true });

    const receipt = await generateReceipt({
      paymentId: newPayment._id,
      customerId: customer._id,
      reason: 'RENT_EXT',
      method: 'CASH',
      amount: payment,
      date: currentDate,
      isDelivery: true
      }, session);

    const customerMovement = await new CustomerMovement({
      customer,
      rent: rent._id,
      machine,
      type: 'NEW_RENT',
      description: `Nueva renta de ${rent.initialWeeks} semana(s)`,
      date: currentDate
    }).save({ session, new: true });

    customer.movements.push(customerMovement._id);
    if (
      !customer.firstRentAt &&
      customer.totalRentWeeks <= 0 &&
      customer.howFound !== 'old'
    ) {
      customer.firstRentAt = currentDate;
    }
    if (forDebt > 0) {
      const customerMovementDebt = await new CustomerMovement({
        customer,
        rent: rent._id,
        machine,
        type: 'DEBT',
        description: `Abono de $${forDebt}`,
        date: currentDate
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
    if (customer.totalRentWeeks >= 2) {
      customer.level = await CustomerLevel.findOne({ id: 'regular' });
    }
    await customer.save({ session, new: false });
    // Save attachments on cloud and
    const uploadPromises = [];
    let imagesUrl = {};
    if(!files.contract || !files.front) {
      const lastRent = await getLastRentByCustomerId(customer._id);
      if(!lastRent) {
        error.message = 'Adjunte las fotos de INE y frente de casa';
        throw error;
      }
      if(!files.contract){
        imagesUrl.contract = lastRent.imagesUrl.contract;
      }
      if(!files.front){
        imagesUrl.front = lastRent.imagesUrl.front;
      }
    }

    for (const [key] of Object.entries(files)) {
      const fileName = `${key}_${rent.num}.${getFileExtension(
        files[key].originalFilename
      )}`;
      uploadPromises.push(uploadFile(files[key].filepath, fileName));
    }
    const results = await Promise.all(uploadPromises);
    for (let i = 0; i < results.length; i++) {
      imagesUrl[Object.keys(files)[i]] = results[i];
    }
    const missingImageKey = ["front", "contract", "board", "tag"].find(imgKey => !imagesUrl[imgKey]);
    if (missingImageKey) {
      throw new Error(`Missing image: ${missingImageKey}`);
    }
    rent.imagesUrl = imagesUrl;
    await rent.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
    return receipt;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al actualizar la entrega. Intente de nuevo o contacte al administrador.'
      );
    }
  }
}
export async function updateDeliveryTimeData({
  deliveryId,
  deliveryTime,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery) {
      error.message = 'No se encontró la entrega indicada.';
      throw error;
    }
    let date = new Date(deliveryTime.date);
    let fromTime = new Date(deliveryTime.date);
    let endTime = new Date(deliveryTime.date);
    if (deliveryTime.timeOption === 'any') {
      date.setHours(21, 59, 59, 0);
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
    delivery.wasSent = true;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar la entrega. Intente de nuevo.'
      );
    }
  }
}
export async function setDeliverySentData({
  deliveryId,
  wasSent,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery) {
      error.message = 'No se encontró la entrega indicada.';
      throw error;
    }
    delivery.wasSent = wasSent;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar la entrega. Intente de nuevo.'
      );
    }
  }
}

export async function getPendingDeliveriesData(userId, userRole = null) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  // If userRole not provided, fetch it
  if (!userRole) {
    const user = await User.findById(userId).populate('role').lean();
    userRole = user.role.id;
  }
  let filter = { status: { $in: ['ESPERA', 'EN_CAMINO'] } };
  if (userRole === 'OPE') {
    filter.operator = userId;
  }
  const pendingDeliveries = await RentDelivery.find(filter)
    .populate([
      { path: 'operator', select: '_id name' },
      {
        path: 'rent',
        select: 'customer _id imagesUrl',
        populate: {
          path: 'customer',
          populate: {
            path: 'currentResidence',
            populate: ['city', 'sector']
          }
        }
      }
    ])
    .sort({ date: 1 })
    .lean();
  for (let i = 0; i < pendingDeliveries.length; i++) {
    let lastRent = null;
    const customer = pendingDeliveries[i].rent.customer;

    if (customer.totalRentWeeks > 0) {
      lastRent = await Rent.findOne({ customer: customer._id, num: { $gt: 0 } })
        .select({ startDate: 1, num: 1 })
        .sort({ startDate: -1 })
        .lean();
    }
    pendingDeliveries[i].rent.customer.lastRent = lastRent?.startDate;
  }
  return pendingDeliveries;
}

export async function getPastDeliveriesData(page, limit, searchTerm, date = null, userId = null) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  let foundRents;
  if (searchTerm && searchTerm.trim() !== '') {
    const foundCustomers = await Customer.find({
      name: { $regex: searchTerm, $options: 'i' }
    }).select({ name: 1 });
    foundRents = await Rent.find({ customer: { $in: foundCustomers } }).select({
      _id: 1
    });
  }
  let filter = {
    status: { $in: ['ENTREGADA', 'CANCELADA'] }
  };
  if (foundRents) {
    filter.rent = { $in: foundRents };
  }
  
  // Add operator filter if userId is provided
  if (userId) {
    filter.operator = userId;
  }
  
  // Add date filter if provided
  if (date) {
    
    const startOfDay = setDateToInitial(dateFromString(date));
    const endOfDay = setDateToEnd(dateFromString(date));
    
    // Set time to the start and end of the day
    
    filter.finishedAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }
  
  const pastDeliveries = await RentDelivery.find(filter)
    .populate({
      path: 'rent',
      select: 'customer _id imagesUrl takenAt',
      model: 'rents',
      populate: {
        path: 'customer',
        model: 'customers',
        select: 'name cell currentResidence',
        populate: {
          path: 'currentResidence',
          model: 'residences',
          populate: [
            {
              path: 'city',
              model: 'cities',
              populate: {
                path: 'sectors',
                model: 'sectors'
              }
            },
            {
              path: 'sector',
              model: 'sectors'
            }
          ]
        }
      }
    })
    .select({
      date: 1,
      finishedAt: 1,
      takenAt: 1,
      _id: 1,
      totalNumber: 1,
      dayNumber: 1,
      status: 1,
      cancellationReason: 1,
      updatedAt: 1
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(limit * (page - 1))
    .lean();

  return {
    list: pastDeliveries.sort((a, b) => {
      if (a.status === 'CANCELADA' && b.status === 'CANCELADA') {
        return b.updatedAt - a.updatedAt; // Sort by updatedAt in descending order for CANCELADA
      }
      if (a.status === 'ENTREGADA' && b.status === 'ENTREGADA') {
        return b.finishedAt - a.finishedAt; // Sort by finishedAt in descending order for ENTREGADA
      }
      if (a.status === 'ENTREGADA' && b.status === 'CANCELADA') {
        return b.updatedAt - a.finishedAt; // Sort by finishedAt in descending order for ENTREGADA
      }
      if (a.status === 'CANCELADA' && b.status === 'ENTREGADA') {
        return b.finishedAt - a.updatedAt; // Sort by finishedAt in descending order for ENTREGADA
      }
    }),
    total: await RentDelivery.countDocuments(filter)
  };
}

export async function getDeliveryData(deliveryId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const delivery = await RentDelivery.findById(deliveryId)
    .populate([
      {
        path: 'rent',
        populate: [
          {
            path: 'customer',
            model: 'customers',
            populate: [
              {
                path: 'currentResidence',
                model: 'residences',
                populate: [
                  {
                    path: 'city',
                    model: 'cities',
                    populate: {
                      path: 'sectors',
                      model: 'sectors'
                    }
                  },
                  {
                    path: 'sector',
                    model: 'sectors'
                  }
                ]
              }
            ]
          }
        ]
      }
    ])
    .lean();
  let lastRent = await getLastRentByCustomerId(delivery.rent.customer._id);
  if (lastRent) {
    delivery.rent.imagesUrl = lastRent.imagesUrl;
  }
  return delivery;
}

export async function cancelDeliveryData({
  deliveryId,
  cancellationReason,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    let delivery = await RentDelivery.findById(deliveryId);
    if (!delivery) {
      error.message = 'No se encontró la entrega indicada.';
      throw error;
    }
    const cancelledStatus = await RentStatus.findOne({ id: 'CANCELADA' });
    let rent = await Rent.findById(delivery.rent);
    let customer = await Customer.findById(rent.customer);
    customer.hasRent = false;
    customer.currentRent = null;
    await customer.save({ session, new: false });

    rent.status = cancelledStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    delivery.status = 'CANCELADA';
    delivery.cancellationReason = cancellationReason;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;
    await delivery.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al cancelar la entrega. Intente de nuevo.'
      );
    }
  }
}

export async function getUnassignedDeliveriesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const unassignedDeliveries = await RentDelivery.find({
    status: 'ESPERA',
    operator: null
  })
    .populate({
      path: 'rent',
      select: 'customer machine',
      populate: [
        {
          path: 'customer',
          select: 'name cell currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'street number suburb references',
            populate: [
              {
                path: 'city',
                select: 'id'
              },
              {
                path: 'sector',
                select: 'name'
              }
            ]
          }
        },
        {
          path: 'machine',
          select: 'machineNum'
        }
      ]
    })
    .sort({ createdAt: 1 })
    .lean();

  return unassignedDeliveries;
}

export async function getOverdueDeliveriesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const overdueDeliveries = await RentDelivery.find({
    status: 'ESPERA',
    operator: { $ne: null },
    $or: [
      { takenAt: { $lte: threeDaysAgo } },
      { takenAt: null }
    ]
  })
    .populate([
      {
        path: 'rent',
        select: 'customer machine',
        populate: [
          {
            path: 'customer',
            select: 'name cell currentResidence',
            populate: {
              path: 'currentResidence',
              select: 'street number suburb references',
              populate: [
                {
                  path: 'city',
                  select: 'id'
                },
                {
                  path: 'sector',
                  select: 'name'
                }
              ]
            }
          },
          {
            path: 'machine',
            select: 'machineNum'
          }
        ]
      },
      {
        path: 'operator',
        select: 'name'
      }
    ])
    .sort({ takenAt: 1 })
    .lean();

  return overdueDeliveries;
}
