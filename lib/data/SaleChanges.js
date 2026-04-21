import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { SaleChange } from '../models/SaleChange';
import { Sale } from '../models/Sale';
import { SalesMachine } from '../models/SalesMachine';
import { SalePickup } from '../models/SalePickup';
import { SaleRepair } from '../models/SaleRepair';
import { SaleDelivery } from '../models/SaleDelivery';
import { Customer } from '../models/Customer';
import { Residence } from '../models/Residence';
import { City } from '../models/City';
import { Sector } from '../models/Sector';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { uploadFile } from '../cloud';
import { getFileExtension } from '../client/utils';
import dayjs from 'dayjs';

Customer.init();
Residence.init();
City.init();
Sector.init();
Vehicle.init();
User.init();

const getNextSaleChangeTotalNumber = async () => {
  const totalDocuments = await SaleChange.countDocuments({
    status: { $ne: 'CANCELADA' }
  });
  return totalDocuments + 1;
};

const getNextSaleChangeDayNumber = async (changeDate) => {
  const start = dayjs(changeDate).startOf('day');
  const end = dayjs(changeDate).endOf('day');
  const todayChanges = await SaleChange.find({
    date: { $gte: start, $lt: end },
    status: { $ne: 'CANCELADA' }
  });
  return todayChanges.length + 1;
};

/**
 * CREATE - Schedule a new warranty exchange (sale change)
 */
export async function saveSaleChangeData({
  saleId,
  leftMachineId,
  operatorId,
  reason,
  changeTime,
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

    // Validate sale
    const sale = await Sale.findById(saleId);
    if (!sale || ['CANCELADA', 'EN_CANCELACION'].includes(sale.status)) {
      error.message = 'La venta indicada no es válida';
      throw error;
    }

    // Validate current machine has warranty
    let currentMachine = await SalesMachine.findById(sale.machine);
    if (!currentMachine || !currentMachine.warranty) {
      error.message = 'La máquina actual no tiene garantía vigente';
      throw error;
    }
    const warrantyDate = new Date(currentMachine.warranty);
    if (new Date() > warrantyDate) {
      error.message = 'La garantía de la máquina ha expirado';
      throw error;
    }

    // Check no pending warranty process
    const hasPendingPickup = await SalePickup.exists({
      sale: saleId,
      status: { $in: ['ESPERA', 'ASIGNADA'] }
    });
    const hasPendingRepair = await SaleRepair.exists({
      machine: sale.machine,
      status: 'PENDIENTE'
    });
    const hasPendingRepairDelivery = await SaleDelivery.exists({
      sale: saleId,
      isRepairReturn: true,
      status: { $in: ['PENDIENTE', 'ASIGNADA'] }
    });
    const hasPendingChange = await SaleChange.exists({
      sale: saleId,
      status: { $in: ['ESPERA', 'ASIGNADA'] }
    });
    if (hasPendingPickup || hasPendingRepair || hasPendingRepairDelivery || hasPendingChange) {
      error.message = 'Ya existe un proceso de garantía en curso para esta venta';
      throw error;
    }

    // Validate leftMachine (the replacement to deliver)
    const leftMachine = await SalesMachine.findById(leftMachineId);
    if (!leftMachine || !leftMachine.active) {
      error.message = 'El equipo de reemplazo no fue encontrado';
      throw error;
    }
    if (leftMachine.status !== 'DISPONIBLE') {
      error.message = 'El equipo de reemplazo no está disponible';
      throw error;
    }

    // Validate operator
    const operator = await User.findById(operatorId);
    if (!operator || !operator.isActive) {
      error.message = 'El operador seleccionado no es válido';
      throw error;
    }
    const vehicle = await Vehicle.findOne({ operator: operatorId });
    if (!vehicle) {
      error.message = 'El operador no tiene vehículo asignado';
      throw error;
    }

    const totalNumber = await getNextSaleChangeTotalNumber();
    const dayNumber = await getNextSaleChangeDayNumber(changeTime.date);

    // Mark leftMachine as EN_CAMBIO and assign to operator's vehicle
    leftMachine.status = 'EN_CAMBIO';
    leftMachine.currentVehicle = vehicle._id;
    leftMachine.currentWarehouse = null;
    leftMachine.updatedAt = currentDate;
    leftMachine.lastUpdatedBy = lastUpdatedBy;
    await leftMachine.save({ session });

    // Create SaleChange
    const newSaleChange = await new SaleChange({
      totalNumber,
      dayNumber,
      sale: saleId,
      pickedMachine: sale.machine,
      leftMachine: leftMachineId,
      status: 'ESPERA',
      reason,
      date: changeTime.date,
      timeOption: changeTime.timeOption,
      fromTime: changeTime.fromTime,
      endTime: changeTime.endTime,
      wasSent: true,
      operator: operatorId,
      takenAt: currentDate,
      takenBy: lastUpdatedBy,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return newSaleChange;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error('Ocurrió un error al agendar el cambio por garantía. Intente de nuevo.');
    }
  }
}

/**
 * GET - Pending sale changes (for operator view)
 */
export async function getPendingSaleChangesData(userId, userRole) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const filter = {
    status: { $in: ['ESPERA', 'ASIGNADA'] }
  };
  if (userRole === 'OPE') {
    filter.operator = userId;
  }

  const changes = await SaleChange.find(filter)
    .populate({
      path: 'sale',
      populate: [
        {
          path: 'customer',
          select: 'name cell currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'nameRef telRef street suburb residenceRef maps sector city',
            populate: [
              { path: 'sector', select: 'name' },
              { path: 'city', select: 'name' }
            ]
          }
        },
        {
          path: 'machine',
          select: 'machineNum brand serialNumber'
        }
      ]
    })
    .populate('pickedMachine', 'machineNum brand serialNumber')
    .populate('leftMachine', 'machineNum brand serialNumber')
    .populate('operator', 'name')
    .sort({ createdAt: 1 })
    .lean();

  return changes;
}

/**
 * GET - Sale change by ID (for completion page)
 */
export async function getSaleChangeByIdData(changeId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const change = await SaleChange.findById(changeId)
    .populate({
      path: 'sale',
      populate: [
        {
          path: 'customer',
          select: 'name cell currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'nameRef telRef street suburb residenceRef maps sector city',
            populate: [
              { path: 'sector', select: 'name' },
              { path: 'city', select: 'name' }
            ]
          }
        }
      ]
    })
    .populate('pickedMachine', 'machineNum brand serialNumber currentVehicle')
    .populate({
      path: 'leftMachine',
      select: 'machineNum brand serialNumber currentVehicle',
      populate: {
        path: 'currentVehicle',
        select: 'operator',
        populate: { path: 'operator', select: '_id name' }
      }
    })
    .populate('operator', '_id name')
    .lean();

  return change;
}

/**
 * COMPLETE - Complete a warranty exchange
 */
export async function markCompleteSaleChangeData({
  changeId,
  files,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();

    const change = await SaleChange.findById(changeId);
    if (!change) {
      error.message = 'El cambio por garantía no fue encontrado';
      throw error;
    }
    if (change.status === 'COMPLETADA' || change.status === 'CANCELADA') {
      error.message = 'Este cambio ya fue completado o cancelado';
      throw error;
    }

    // Validate the leftMachine is on the operator's vehicle
    const leftMachine = await SalesMachine.findById(change.leftMachine);
    if (!leftMachine) {
      error.message = 'El equipo a dejar no fue encontrado';
      throw error;
    }

    const operatorVehicle = await Vehicle.findOne({ operator: change.operator });
    if (!operatorVehicle) {
      error.message = 'El operador no tiene vehículo asignado';
      throw error;
    }
    if (!leftMachine.currentVehicle || leftMachine.currentVehicle.toString() !== operatorVehicle._id.toString()) {
      error.message = 'El equipo a dejar no está en el vehículo del operador';
      throw error;
    }

    // Upload evidence photos
    let imagesUrl = {};
    if (files?.front) {
      const fileName = `sale_change_front_${new Date().getTime()}.${getFileExtension(files.front.originalFilename)}`;
      imagesUrl.front = await uploadFile(files.front.filepath, fileName);
    }
    if (files?.tag) {
      const fileName = `sale_change_tag_${new Date().getTime()}.${getFileExtension(files.tag.originalFilename)}`;
      imagesUrl.tag = await uploadFile(files.tag.filepath, fileName);
    }

    // Get the sale
    const sale = await Sale.findById(change.sale);
    if (!sale) {
      error.message = 'La venta no fue encontrada';
      throw error;
    }

    // Get the picked machine (current machine being collected)
    const pickedMachine = await SalesMachine.findById(change.pickedMachine);
    if (!pickedMachine) {
      error.message = 'El equipo a recoger no fue encontrado';
      throw error;
    }

    // 1. pickedMachine → RECOLECTADA, assign to operator's vehicle
    pickedMachine.status = 'RECOLECTADA';
    pickedMachine.currentVehicle = operatorVehicle._id;
    pickedMachine.currentWarehouse = null;
    pickedMachine.updatedAt = currentDate;
    pickedMachine.lastUpdatedBy = lastUpdatedBy;
    await pickedMachine.save({ session });

    // 2. leftMachine → VENDIDO (it's now with the customer)
    leftMachine.status = 'VENDIDO';
    leftMachine.isSold = true;
    leftMachine.currentVehicle = null;
    leftMachine.currentWarehouse = null;
    // Transfer warranty from old machine
    leftMachine.warranty = pickedMachine.warranty;
    leftMachine.updatedAt = currentDate;
    leftMachine.lastUpdatedBy = lastUpdatedBy;
    await leftMachine.save({ session });

    // 3. Update sale to point to leftMachine
    sale.machine = change.leftMachine;
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;
    await sale.save({ session });

    // 4. Update change record
    change.status = 'COMPLETADA';
    change.imagesUrl = imagesUrl;
    change.finishedAt = currentDate;
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return change;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error('Ocurrió un error al completar el cambio por garantía. Intente de nuevo.');
    }
  }
}

/**
 * CANCEL - Cancel a pending sale change
 */
export async function cancelSaleChangeData({
  changeId,
  cancellationReason,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();

    const change = await SaleChange.findById(changeId);
    if (!change) {
      error.message = 'El cambio por garantía no fue encontrado';
      throw error;
    }
    if (change.status !== 'ESPERA' && change.status !== 'ASIGNADA') {
      error.message = 'Solo se pueden cancelar cambios pendientes';
      throw error;
    }

    // Return leftMachine to DISPONIBLE
    const leftMachine = await SalesMachine.findById(change.leftMachine);
    if (leftMachine) {
      leftMachine.status = 'DISPONIBLE';
      leftMachine.currentVehicle = null;
      leftMachine.updatedAt = currentDate;
      leftMachine.lastUpdatedBy = lastUpdatedBy;
      await leftMachine.save({ session });
    }

    change.status = 'CANCELADA';
    change.cancellationReason = cancellationReason || '';
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return change;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error('Ocurrió un error al cancelar el cambio por garantía. Intente de nuevo.');
    }
  }
}
