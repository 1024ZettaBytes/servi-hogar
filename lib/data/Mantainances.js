import { dateDiffInDays, hasSundayBetween } from '../client/utils';
import { connectToDatabase, isConnected } from '../db';
import { City } from '../models/City';
import { Rent } from '../models/Rent';
import { Residence } from '../models/Residence';
import { Sector } from '../models/Sector';
import { User } from '../models/User';

import { Mantainance } from '../models/Mantainance';
import { MachineStatus } from '../models/MachineStatus';
import { MACHINE_STATUS_LIST } from '../consts/OBJ_CONTS';
import { Machine } from '../models/Machine';
import { UsedInventory } from '../models/UsedInventory';
import { Inventory } from '../models/Inventory';
Rent.init();
Residence.init();
City.init();
Sector.init();

export const getNextMantId = async () => {
  const mant = await Mantainance.findOne({}, {}, { sort: { num: -1 } });
  if (mant && mant.totalNumber && mant.totalNumber > 0) {
    return mant.totalNumber + 1;
  }
  return 1;
};

export async function completeMantainanceData({
  mantainanceId,
  description,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let mantainance = await Mantainance.findById(mantainanceId).populate({
      path: 'usedInventory',
      model: UsedInventory
    });

    if (!mantainance) {
      error.message = 'No se encontró el mantenimiento indicado.';
      throw error;
    }
    mantainance.status = 'FINALIZADO';
    mantainance.finishedAt = currentDate;
    mantainance.updatedAt = currentDate;
    mantainance.lastUpdatedBy = lastUpdatedBy;
    mantainance.description = description;
    let expenses = 0;
    if (mantainance.usedInventory && mantainance.usedInventory.length > 0) {
      for (let i in mantainance.usedInventory) {
        const usedInventory = mantainance.usedInventory[i];
        expenses += usedInventory.price * usedInventory.qty;
      }
    }
    await session.startTransaction();

    await mantainance.save({ session, new: false });

    const machine = await Machine.findById(mantainance.machine);
    const readyStatus = await MachineStatus.findOne({
      id: MACHINE_STATUS_LIST.LISTO
    });
    machine.status = readyStatus._id;
    machine.updatedAt = currentDate;
    machine.expenses += expenses;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar el mantenimiento. Intente de nuevo.'
      );
    }
  }
}

export async function getMantData(userId, pending = false) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const user = await User.findById(userId).populate('role').lean();
  let filter = {
    status: {
      $in: pending ? ['PENDIENTE', 'EN_PROGRESO'] : ['FINALIZADO', 'CANCELADO']
    }
  };
  if (user.role.id === 'TEC') {
    filter.takenBy = userId;
  }
  const pendingMantainances = await Mantainance.find(filter)
    .populate([
      { path: 'takenBy', select: '_id name' },
      {
        path: 'machine',
        select: '_id machineNum'
      }
    ])
    .sort({ updatedAt: 1 })
    .lean();
  if (pending) {
    for (let i in pendingMantainances) {
      const creationDate = new Date(pendingMantainances[i].createdAt);
      pendingMantainances[i].daysSinceCreate =
        dateDiffInDays(creationDate, new Date()) -
        (hasSundayBetween(creationDate, new Date()) ? 1 : 0);
    }
  }
  return pendingMantainances;
}

export const getMantainanceById = async (id, userId) => {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const mantainance = await Mantainance.findById(id)
    .populate([
      { path: 'takenBy', select: '_id name' },
      {
        path: 'usedInventory',
        select: 'inventoryProduct qty price',
        populate: { path: 'inventoryProduct', select: 'code name' }
      },
      {
        path: 'machine',
        select: '_id machineNum'
      }
    ])
    .lean();
  if (
    !mantainance ||
    (userId ? mantainance.takenBy._id.toString() !== userId : false)
  ) {
    const error = new Error('No se encontró el mantenimiento indicado.');
    error.name = 'Internal';
    throw error;
  }
  return mantainance;
};

export const addUsedProductData = async ({
  mantainanceId,
  productId,
  qty,
  lastUpdatedBy
}) => {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const mantainance = await Mantainance.findById(mantainanceId);
    if (!mantainance) {
      error.message = 'No se encontró el mantenimiento indicado.';
      throw error;
    }
    const product = await Inventory.findById(productId);
    if (!product) {
      error.message = 'No se encontró el producto indicado.';
      throw error;
    }
    if (product.stock < qty) {
      error.message = 'No hay suficiente cantidad de la refacción indicada.';
      throw error;
    }
    const newUsedInventory = await new UsedInventory({
      inventoryProduct: productId,
      mantainance: mantainanceId,
      qty,
      price: product.latestCost,
      date: Date.now(),
      createdBy: lastUpdatedBy
    });

    product.stock -= qty;
    product.updatedAt = Date.now();
    product.lastUpdatedBy = lastUpdatedBy;
    await session.startTransaction();

    await product.save({ session, new: false });
    await newUsedInventory.save({ session, new: true });

    let usedInventories = mantainance.usedInventory || [];
    usedInventories.push(newUsedInventory._id);
    mantainance.usedInventory = usedInventories;
    mantainance.updatedAt = Date.now();
    mantainance.lastUpdatedBy = lastUpdatedBy;

    await mantainance.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al agregar el producto usado. Intente de nuevo.'
      );
    }
  }
};

export const cancelMantainanceData = async ({
  mantainanceId,
  cancellationReason,
  lastUpdatedBy
}) => {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const mantainance = await Mantainance.findById(mantainanceId);
    if (!mantainance) {
      error.message = 'No se encontró el mantenimiento indicado.';
      throw error;
    }
    mantainance.status = 'CANCELADO';
    mantainance.cancellationReason = cancellationReason;
    mantainance.updatedAt = Date.now();
    mantainance.lastUpdatedBy = lastUpdatedBy;

    await session.startTransaction();

    await mantainance.save({ session, new: false });

    const machine = await Machine.findById(mantainance.machine);
    const readyStatus = await MachineStatus.findOne({
      id: MACHINE_STATUS_LIST.LISTO
    });
    machine.status = readyStatus._id;
    machine.updatedAt = Date.now();
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al cancelar el mantenimiento. Intente de nuevo.'
      );
    }
  }
};

export const getMachinesWithoutMaintenance = async () => {
  await connectToDatabase();
  
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  
  // Get all active machines and their last maintenance in parallel
  const [allMachines, recentMaintenances] = await Promise.all([
    Machine.find({ active: true })
      .select('_id machineNum brand capacity createdAt')
      .lean(),
    Mantainance.find({
      status: {$in: ['FINALIZADO', 'PENDIENTE']},
      finishedAt: { $gte: oneYearAgo }
    })
      .select('machine finishedAt')
      .lean()
  ]);
  
  // Create a Set of machine IDs that have had maintenance in the last year
  const machinesWithRecentMaintenance = new Set(
    recentMaintenances.map(maint => maint.machine.toString())
  );
  console.log(
    `Found ${recentMaintenances.length} machines with maintenance in the last year.`
  );
  // Filter machines that haven't had maintenance in the last year
  const machinesWithoutMaintenance = allMachines.filter(machine => {
    const machineId = machine._id.toString();
    return !machinesWithRecentMaintenance.has(machineId);
  });
  console.log(
    `Found ${machinesWithoutMaintenance.length} machines without maintenance in the last year.`
  );
  // Add days since creation for each machine
  const currentDate = new Date();
  machinesWithoutMaintenance.forEach(machine => {
    machine.daysSinceCreation = dateDiffInDays(new Date(machine.createdAt), currentDate);
  });
  
  return machinesWithoutMaintenance.sort((a, b) => a.machineNum - b.machineNum);
};
