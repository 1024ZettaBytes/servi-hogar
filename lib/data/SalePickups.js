import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import {
  dateDiffInDays,
  dateFromString,
  getTimeFromDate,
  setDateToEnd,
  setDateToInitial
} from '../client/utils';
import { Sale } from '../models/Sale';
import { SalesMachine } from '../models/SalesMachine';
import { Customer } from '../models/Customer';
import { SalePickup } from '../models/SalePickup';
import { SaleDelivery } from '../models/SaleDelivery';
import { Residence } from '../models/Residence';
import { City } from '../models/City';
import { Sector } from '../models/Sector';
import dayjs from 'dayjs';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { SaleRepair } from '../models/SaleRepair';
import { CustomerLevel } from '../models/CustomerLevel';
import { Vehicle } from '../models/Vehicle';
import { uploadFile } from '../cloud';

CustomerLevel.init();
Residence.init();
City.init();
Sector.init();

const getNextSalePickupTotalNumber = async () => {
  const totalDocuments = await SalePickup.countDocuments({
    status: { $ne: 'CANCELADA' }
  });
  return totalDocuments + 1;
};

const getNextSalePickupDayNumber = async (pickupDate) => {
  const start = dayjs(pickupDate).startOf('day');
  const end = dayjs(pickupDate).endOf('day');
  const todayPickups = await SalePickup.find({
    date: { $gte: start, $lt: end },
    status: { $ne: 'CANCELADA' }
  });
  return todayPickups.length + 1;
};

export async function saveSalePickupData({
  saleId,
  machineId,
  pickupTime,
  reason,
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
    
    // Validate sale exists and has warranty
    const sale = await Sale.findById(saleId);
    if (!sale || sale.status === 'CANCELADA') {
      error.message = 'La venta indicada no es válida';
      throw error;
    }

    // Validate machine and warranty
    const machine = await SalesMachine.findById(machineId);
    if (!machine || !machine.warranty) {
      error.message = 'La máquina no tiene garantía vigente';
      throw error;
    }

    const warrantyDate = new Date(machine.warranty);
    const today = new Date();
    if (today > warrantyDate) {
      error.message = 'La garantía de la máquina ha expirado';
      throw error;
    }

    // Check if there's already a pending or active pickup for this sale/machine
    const existingPickup = await SalePickup.findOne({
      sale: saleId,
      machine: machineId,
      status: { $in: ['ESPERA', 'ASIGNADA'] }
    }).session(session);
    
    if (existingPickup) {
      error.message = 'Ya existe una recolección pendiente para esta máquina. Complete o cancele la recolección existente antes de crear una nueva.';
      throw error;
    }

    // Also check if there's a pending repair for this machine
    const pendingRepair = await SaleRepair.findOne({
      machine: machineId,
      status: 'PENDIENTE'
    }).session(session);

    if (pendingRepair) {
      error.message = 'Esta máquina ya tiene una reparación en proceso. No se puede agendar otra recolección.';
      throw error;
    }

    let date = new Date(pickupTime.date);
    let fromTime = new Date(pickupTime.date);
    let endTime = new Date(pickupTime.date);
    if (pickupTime.timeOption === 'any') {
      date.setHours(21, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(pickupTime.fromTime));
      const endT = getTimeFromDate(new Date(pickupTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }

    const totalNumber = await getNextSalePickupTotalNumber();
    const dayNumber = await getNextSalePickupDayNumber(new Date(pickupTime.date));
    
    const pickup = await new SalePickup({
      totalNumber,
      dayNumber,
      sale: saleId,
      machine: machineId,
      date,
      timeOption: pickupTime.timeOption,
      fromTime,
      endTime,
      reason,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy,
      wasSent: true
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return pickup;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al guardar la recolección. Intente de nuevo.'
      );
    }
  }
}

export async function getPendingSalePickupsData(userId, isDetailed = true, userRole = null) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  // If userRole not provided, fetch it
  if (!userRole) {
    const user = await User.findById(userId).populate('role').lean();
    userRole = user.role.id;
  }
  
  let filter = { status: { $in: ['ESPERA', 'ASIGNADA'] } };
  if (userRole === 'OPE') {
    filter.operator = userId;
  }
  
  let pendingPickups = {};
  if (isDetailed) {
    pendingPickups = await SalePickup.find(filter)
      .populate([
        { path: 'operator', select: '_id name' },
        {
          path: 'sale',
          populate: [
            {
              path: 'customer',
              populate: [
                {
                  path: 'currentResidence',
                  populate: ['city', 'sector']
                },
                {
                  path: 'level'
                }
              ]
            },
            {
              path: 'machine',
              select: 'machineNum brand warranty'
            }
          ]
        },
        {
          path: 'machine',
          select: 'machineNum brand warranty'
        }
      ])
      .sort({ date: 1 })
      .lean();
    
    // Fetch and attach delivery data for each pickup
    for (let pickup of pendingPickups) {
      if (pickup.sale?._id) {
        const delivery = await SaleDelivery.findOne({ 
          sale: pickup.sale._id,
          isRepairReturn: { $ne: true }
        }).lean();
        
        if (delivery) {
          pickup.sale.delivery = delivery;
        }
      }
    }
  } else {
    pendingPickups = { count: await SalePickup.countDocuments(filter) };
  }

  return pendingPickups;
}

export async function getPastSalePickupsData(page, limit, searchTerm, date = null, userId = null) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  let foundSales;
  if (searchTerm && searchTerm.trim() !== '') {
    const isForMachine = !isNaN(searchTerm);
    if (isForMachine) {
      const foundMachines = await SalesMachine.find({
        machineNum: searchTerm
      }).select({ _id: 1 });
      foundSales = await Sale.find({ machine: { $in: foundMachines } }).select({
        _id: 1
      });
    } else {
      const foundCustomers = await Customer.find({
        name: { $regex: searchTerm, $options: 'i' }
      }).select({ _id: 1 });
      foundSales = await Sale.find({
        customer: { $in: foundCustomers }
      }).select({
        _id: 1
      });
    }
  }
  
  let filter = {
    status: { $in: ['COMPLETADA', 'CANCELADA'] }
  };
  if (foundSales) {
    filter.sale = { $in: foundSales };
  }

  // Add operator filter if userId is provided
  if (userId) {
    filter.operator = userId;
  }

  // Add date filter if provided
  if (date) {
    const startOfDay = setDateToInitial(dateFromString(date));
    const endOfDay = setDateToEnd(dateFromString(date));
    filter.finishedAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  const pastPickups = await SalePickup.find(filter)
    .populate([
      {
        path: 'sale',
        populate: {
          path: 'customer',
          populate: {
            path: 'currentResidence',
            populate: ['city', 'sector']
          }
        }
      },
      {
        path: 'machine',
        select: 'machineNum brand'
      },
      {
        path: 'operator',
        select: '_id name'
      },
      {
        path: 'lastUpdatedBy',
        select: '_id name'
      }
    ])
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(limit * (page - 1))
    .lean();
    
  return {
    list: pastPickups.sort((a, b) => {
      if (a.status === 'CANCELADA' && b.status === 'CANCELADA') {
        return b.updatedAt - a.updatedAt;
      }
      if (a.status === 'COMPLETADA' && b.status === 'COMPLETADA') {
        return b.finishedAt - a.finishedAt;
      }
      if (a.status === 'COMPLETADA' && b.status === 'CANCELADA') {
        return b.updatedAt - a.finishedAt;
      }
      if (a.status === 'CANCELADA' && b.status === 'COMPLETADA') {
        return b.finishedAt - a.updatedAt;
      }
      return 0;
    }),
    total: await SalePickup.countDocuments(filter)
  };
}

export async function getSalePickupData(pickupId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const pickup = await SalePickup.findById(pickupId)
    .lean()
    .populate([
      {
        path: 'sale',
        populate: {
          path: 'customer',
          populate: [
            { path: 'level' },
            {
              path: 'currentResidence',
              populate: [
                {
                  path: 'city',
                  populate: 'sectors'
                },
                'sector'
              ]
            }
          ]
        }
      },
      {
        path: 'machine',
        select: 'machineNum brand warranty serialNumber'
      },
      {
        path: 'operator',
        select: '_id name'
      }
    ])
    .exec();
    
  return pickup;
}

const getFileExtension = (filename) => {
  return filename.split('.').pop();
};

export async function markCompleteSalePickupData({
  pickupId,
  files,
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
    
    const pickup = await SalePickup.findById(pickupId);
    if (!pickup) {
      error.message = 'Recolección no encontrada';
      throw error;
    }
    
    if (pickup.status !== 'ASIGNADA') {
      error.message = 'La recolección no está asignada';
      throw error;
    }

    // Upload images to cloud storage
    
    let imagesUrl = {};
    if (files && Object.keys(files).length > 0) {
      const timestamp = Date.now();
      for (const [key, value] of Object.entries(files)) {
        if (value && value.filepath) {
          const ext = getFileExtension(value.originalFilename || value.newFilename);
          const fileName = `sale-pickups/${pickupId}_${key}_${timestamp}.${ext}`;
          const url = await uploadFile(value.filepath, fileName);
          imagesUrl[key] = url;
        }
      }
    }

    // Get the machine and update its location
    const machine = await SalesMachine.findById(pickup.machine);
    if (!machine) {
      error.message = 'Máquina no encontrada';
      throw error;
    }

    // Get the operator's vehicle
    const populatedPickup = await SalePickup.findById(pickupId).populate('operator');
    if (!populatedPickup || !populatedPickup.operator) {
      error.message = 'Operador no encontrado';
      throw error;
    }

    const vehicle = await Vehicle.findOne({ operator: populatedPickup.operator._id });
    if (!vehicle) {
      error.message = 'Vehículo del operador no encontrado';
      throw error;
    }

    // Add machine to vehicle
    if (!vehicle.machinesOn.includes(machine._id)) {
      vehicle.machinesOn.push(machine._id);
      await vehicle.save({ session, new: false });
    }

    // Update machine location and status
    machine.currentVehicle = vehicle._id;
    machine.currentWarehouse = null;
    machine.status = 'RECOLECTADA'; // Change from VENDIDO to RECOLECTADA (picked up for repair)
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    // Update pickup status
    pickup.status = 'COMPLETADA';
    pickup.finishedAt = currentDate;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    if (Object.keys(imagesUrl).length > 0) {
      pickup.imagesUrl = { ...imagesUrl };
    }
    await pickup.save({ session, new: false });

    // Find a technician to assign repair
    const tecRole = await Role.findOne({ id: 'TEC' });
    let technician = await User.findOne({
      role: tecRole._id,
      isActive: true
    }).sort({ createdAt: 1 });

    if (!technician) {
      error.message = 'No se encontró un técnico disponible para asignar la reparación';
      throw error;
    }

    // Get next repair number
    const totalRepairs = await SaleRepair.countDocuments();
    const repairNumber = totalRepairs + 1;

    // Create repair record
    const repair = await new SaleRepair({
      totalNumber: repairNumber,
      salePickup: pickup._id,
      machine: pickup.machine,
      takenAt: currentDate,
      takenBy: technician._id,
      status: 'PENDIENTE',
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    
    return { pickup, repair };
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al completar la recolección. Intente de nuevo.'
      );
    }
  }
}

export async function assignSalePickupData({
  pickupId,
  operatorId,
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
    
    const pickup = await SalePickup.findById(pickupId);
    if (!pickup) {
      error.message = 'Recolección no encontrada';
      throw error;
    }
    
    if (pickup.status !== 'ESPERA') {
      error.message = 'La recolección ya fue asignada';
      throw error;
    }

    pickup.status = 'ASIGNADA';
    pickup.operator = operatorId;
    pickup.takenAt = currentDate;
    pickup.takenBy = lastUpdatedBy;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    
    await pickup.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return pickup;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al asignar la recolección. Intente de nuevo.'
      );
    }
  }
}

export async function cancelSalePickupData({
  pickupId,
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
    
    const pickup = await SalePickup.findById(pickupId);
    if (!pickup) {
      error.message = 'Recolección no encontrada';
      throw error;
    }
    
    if (!['ESPERA', 'ASIGNADA'].includes(pickup.status)) {
      error.message = 'La recolección no puede ser cancelada';
      throw error;
    }

    pickup.status = 'CANCELADA';
    pickup.cancellationReason = cancellationReason;
    pickup.finishedAt = currentDate;
    pickup.updatedAt = currentDate;
    pickup.lastUpdatedBy = lastUpdatedBy;
    
    await pickup.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return pickup;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al cancelar la recolección. Intente de nuevo.'
      );
    }
  }
}
