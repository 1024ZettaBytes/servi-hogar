import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { WarehouseMachine } from '../models/WarehouseMachine';
import { SalesMachine } from '../models/SalesMachine';
import { Warehouse } from '../models/Warehouse';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { Machine } from '../models/Machine';
import { MachineStatus } from '../models/MachineStatus';
import { getFileExtension } from '../client/utils';
import { uploadFile } from '../cloud';
import { ConditioningRecord } from '../models/ConditioningRecord';
import { MACHINE_MOVEMENT_LIST, MACHINE_STATUS_LIST, WAREHOUSE_MACHINE_STATUS } from '../consts/OBJ_CONTS';
import { MachineMovement } from '../models/MachineMovement';
import { transferMachinePartnerData } from './Partners';

Warehouse.init();
Vehicle.init();
User.init();
Machine.init();

/**
 * GET all active warehouse machines
 */
export async function getWarehouseMachinesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await WarehouseMachine.find({ active: true })
    .populate('currentWarehouse')
    .populate({ path: 'currentVehicle', populate: { path: 'operator' } })
    .populate('purchasedBy', 'name')
    .populate('assignedTechnician', 'name')
    .sort({ entryNumber: -1 })
    .lean();
  return machines;
}

/**
 * GET warehouse machines by status
 */
export async function getWarehouseMachinesByStatusData(status) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await WarehouseMachine.find({ active: true, status })
    .populate('currentWarehouse')
    .populate({ path: 'currentVehicle', populate: { path: 'operator' } })
    .populate('purchasedBy', 'name')
    .populate('assignedTechnician', 'name')
    .sort({ entryNumber: -1 })
    .lean();
  return machines;
}

/**
 * GET warehouse machines by status - minimal fields for dropdowns
 */
export async function getWarehouseMachinesByStatusLightData(status) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await WarehouseMachine.find({ active: true, status })
    .select('_id entryNumber serialNumber brand currentVehicle')
    .populate({ path: 'currentVehicle', select: 'operator', populate: { path: 'operator', select: '_id name' } })
    .sort({ entryNumber: -1 })
    .lean();
  return machines;
}

/**
 * GET warehouse machine by id
 */
export async function getWarehouseMachineByIdData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machine = await WarehouseMachine.findById(id)
    .populate('currentWarehouse')
    .populate({ path: 'currentVehicle', populate: { path: 'operator' } })
    .populate('purchasedBy', 'name')
    .populate('assignedTechnician', 'name')
    .populate('fromMachine')
    .populate('resultingMachine')
    .populate('resultingSalesMachine')
    .lean();
  return machine;
}

/**
 * GET summary counts for dashboard
 */
export async function getWarehouseSummaryData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const counts = await WarehouseMachine.aggregate([
    { $match: { active: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const originCounts = await WarehouseMachine.aggregate([
    { $match: { active: true, status: 'ALMACENADA' } },
    {
      $group: {
        _id: '$origin',
        count: { $sum: 1 }
      }
    }
  ]);

  return { statusCounts: counts, originCounts };
}

/**
 * CREATE - Register new warehouse machine (Mexicali entry)
 */
export async function saveWarehouseMachineData({
  brand,
  serialNumber,
  cost,
  warehouseId,
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

    // Validate serial number if provided
    if (serialNumber && serialNumber.trim() !== '') {
      const existingMachine = await WarehouseMachine.findOne({
        serialNumber: serialNumber.trim(),
        active: true
      });
      if (existingMachine) {
        error.message = 'Ya existe una máquina en almacén con el número de serie ' + serialNumber;
        throw error;
      }
    }

    // Auto-increment entryNumber (global across all origins)
    const lastEntry = await WarehouseMachine.findOne().sort({ entryNumber: -1 }).lean();
    const entryNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;

    // Upload 4 entry photos
    let entryPhotos = [];
    const photoFields = ['photo1', 'photo2', 'photo3', 'photo4'];
    for (const field of photoFields) {
      if (files?.[field]) {
        const fileName = `warehouse_machine_${field}_${new Date().getTime()}.${getFileExtension(
          files[field].originalFilename
        )}`;
        const url = await uploadFile(files[field].filepath, fileName);
        entryPhotos.push(url);
      }
    }

    let newMachine = await new WarehouseMachine({
      entryNumber,
      origin: 'NUEVA',
      brand,
      serialNumber: serialNumber || '',
      cost: cost || 0,
      status: 'ALMACENADA',
      entryPhotos,
      currentWarehouse: warehouseId || null,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
      active: true
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return newMachine;
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
        'Ocurrió un error al registrar la máquina en el almacén. Intente de nuevo.'
      );
    }
  }
}

/**
 * CREATE - Register street purchase by operator (Compra en calle)
 */
export async function registerStreetPurchaseData({
  brand,
  serialNumber,
  cost,
  files,
  purchasedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();

    // Auto-increment entryNumber (global across all origins)
    const lastEntry = await WarehouseMachine.findOne().sort({ entryNumber: -1 }).lean();
    const entryNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;

    // Upload 4 entry photos
    let entryPhotos = [];
    const photoFields = ['photo1', 'photo2', 'photo3', 'photo4'];
    for (const field of photoFields) {
      if (files?.[field]) {
        const fileName = `warehouse_machine_${field}_${new Date().getTime()}.${getFileExtension(
          files[field].originalFilename
        )}`;
        const url = await uploadFile(files[field].filepath, fileName);
        entryPhotos.push(url);
      }
    }

    // Validate serial number if provided
    if (serialNumber && serialNumber.trim() !== '') {
      const existingMachine = await WarehouseMachine.findOne({
        serialNumber: serialNumber.trim(),
        active: true
      });
      if (existingMachine) {
        error.message = 'Ya existe una máquina en almacén con el número de serie ' + serialNumber;
        throw error;
      }
    }

    // Find operator's vehicle
    const vehicle = await Vehicle.findOne({ operator: purchasedBy });
    if (!vehicle) {
      error.message = 'No se encontró un vehículo asignado al operador';
      throw error;
    }

    let newMachine = await new WarehouseMachine({
      entryNumber,
      origin: 'COMPRA_CALLE',
      brand,
      serialNumber: serialNumber || '',
      cost: cost || 0,
      status: 'EN_VEHICULO',
      entryPhotos,
      currentWarehouse: null,
      currentVehicle: vehicle._id,
      purchasedBy,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy: purchasedBy,
      active: true
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return newMachine;
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
        'Ocurrió un error al registrar la compra en calle. Intente de nuevo.'
      );
    }
  }
}

/**
 * RECEIVE - Receive a warehouse machine from vehicle to warehouse (EN_VEHICULO → ALMACENADA)
 */
export async function receiveWarehouseMachineData({
  warehouseMachineId,
  warehouseId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    const machine = await WarehouseMachine.findById(warehouseMachineId);
    if (!machine || !machine.active) {
      error.message = 'La máquina de almacén no fue encontrada';
      throw error;
    }
    if (machine.status !== 'EN_VEHICULO') {
      error.message = 'Solo se pueden recibir máquinas que estén en un vehículo';
      throw error;
    }

    machine.status = 'ALMACENADA';
    machine.currentVehicle = null;
    machine.currentWarehouse = warehouseId || null;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;

    await machine.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return machine;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al recibir la máquina del vehículo. Intente de nuevo.'
      );
    }
  }
}

/**
 * UPDATE - General update for warehouse machine
 */
export async function updateWarehouseMachineData({
  _id,
  brand,
  serialNumber,
  cost,
  currentWarehouse,
  status,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  if (!isConnected()) {
    await connectToDatabase();
  }
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    const machine = await WarehouseMachine.findById(_id);
    if (!machine || !machine.active) {
      error.message = 'La máquina no fue encontrada';
      throw error;
    }

    if (brand) machine.brand = brand;
    if (serialNumber !== undefined) machine.serialNumber = serialNumber;
    if (cost !== undefined) machine.cost = cost;
    if (currentWarehouse !== undefined) machine.currentWarehouse = currentWarehouse;
    if (status) machine.status = status;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;

    await machine.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return machine;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar la máquina del almacén. Intente de nuevo.'
      );
    }
  }
}

/**
 * ASSIGN TECHNICIAN - Move warehouse machine to EN_ACONDICIONAMIENTO
 */
export async function assignTechnicianData({
  warehouseMachineId,
  technicianId,
  warehouseId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    const machine = await WarehouseMachine.findById(warehouseMachineId);
    if (!machine || !machine.active) {
      error.message = 'La máquina no fue encontrada';
      throw error;
    }
    if (machine.status !== 'ALMACENADA') {
      error.message = 'Solo se pueden asignar máquinas con estado ALMACENADA';
      throw error;
    }

    // Validate technician exists
    const technician = await User.findById(technicianId);
    if (!technician || !technician.isActive) {
      error.message = 'El técnico seleccionado no fue encontrado o está inactivo';
      throw error;
    }

    machine.status = 'EN_ACONDICIONAMIENTO';
    machine.assignedTechnician = technicianId;
    machine.techAssignedAt = currentDate;
    if (warehouseId) machine.currentWarehouse = warehouseId;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;

    await machine.save({ session });

    // Create conditioning record
    await new ConditioningRecord({
      warehouseMachine: machine._id,
      technician: technicianId,
      status: 'PENDIENTE',
      assignedAt: currentDate,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return machine;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al asignar el técnico. Intente de nuevo.'
      );
    }
  }
}

/**
 * COMPLETE CONDITIONING - Tech finishes, machine becomes ACONDICIONADA
 */
export async function completeTechServiceData({
  warehouseMachineId,
  warehouseId,
  files,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    const machine = await WarehouseMachine.findById(warehouseMachineId);
    if (!machine || !machine.active) {
      error.message = 'La máquina no fue encontrada';
      throw error;
    }
    if (machine.status !== 'EN_ACONDICIONAMIENTO') {
      error.message = 'Solo se puede completar el acondicionamiento de máquinas en ese estado';
      throw error;
    }

    // Upload 4 conditioning photos
    let conditioningPhotos = [];
    const photoFields = ['photo1', 'photo2', 'photo3', 'photo4'];
    for (const field of photoFields) {
      if (files?.[field]) {
        const fileName = `wm_conditioning_${field}_${new Date().getTime()}.${getFileExtension(
          files[field].originalFilename
        )}`;
        const url = await uploadFile(files[field].filepath, fileName);
        conditioningPhotos.push(url);
      }
    }

    if (conditioningPhotos.length < 4) {
      error.message = 'Se requieren las 4 fotos del acondicionamiento';
      throw error;
    }

    // Update conditioning record
    const condRecord = await ConditioningRecord.findOne({
      warehouseMachine: machine._id,
      status: 'PENDIENTE'
    });
    if (condRecord) {
      condRecord.status = 'COMPLETADO';
      condRecord.completedAt = currentDate;
      condRecord.conditioningPhotos = conditioningPhotos;
      condRecord.updatedAt = currentDate;
      condRecord.lastUpdatedBy = lastUpdatedBy;
      await condRecord.save({ session });
    }

    // Update warehouse machine to ACONDICIONADA
    machine.status = 'ACONDICIONADA';
    machine.conditioningPhotos = conditioningPhotos;
    machine.currentWarehouse = warehouseId || machine.currentWarehouse || null;
    machine.assignedTechnician = null;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return { warehouseMachine: machine };
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al completar el acondicionamiento. Intente de nuevo.'
      );
    }
  }
}

/**
 * GET warehouse machines in conditioning assigned to a specific technician
 */
export async function getConditioningByTechnicianData(technicianId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await WarehouseMachine.find({
    active: true,
    status: 'EN_ACONDICIONAMIENTO',
    assignedTechnician: technicianId
  })
    .populate('currentWarehouse')
    .populate('assignedTechnician', 'name')
    .sort({ techAssignedAt: 1 })
    .lean();
  return machines;
}

/**
 * GET all warehouse machines in conditioning (for admin)
 */
export async function getAllConditioningData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await WarehouseMachine.find({
    active: true,
    status: 'EN_ACONDICIONAMIENTO'
  })
    .populate('currentWarehouse')
    .populate('assignedTechnician', 'name')
    .sort({ techAssignedAt: 1 })
    .lean();
  return machines;
}

/**
 * LOAD TO VEHICLE - Move warehouse machine to operator's vehicle
 */
export async function loadToVehicleData({
  warehouseMachineId,
  operatorId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    const machine = await WarehouseMachine.findById(warehouseMachineId);
    if (!machine || !machine.active) {
      error.message = 'La máquina de almacén no fue encontrada';
      throw error;
    }
    if (machine.status !== 'ACONDICIONADA') {
      error.message = 'Solo se pueden cargar máquinas con estado ACONDICIONADA';
      throw error;
    }

    // Find operator's vehicle
    const vehicle = await Vehicle.findOne({ operator: operatorId });
    if (!vehicle) {
      error.message = 'No se encontró un vehículo asignado al operador seleccionado';
      throw error;
    }

    machine.status = 'EN_VEHICULO';
    machine.currentVehicle = vehicle._id;
    machine.currentWarehouse = null;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;

    await machine.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return machine;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al cargar la máquina al vehículo. Intente de nuevo.'
      );
    }
  }
}

/**
 * DISMANTLE - Mark warehouse machine as DESMANTELADA
 */
export async function dismantleWarehouseMachineData({
  warehouseMachineId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    const machine = await WarehouseMachine.findById(warehouseMachineId);
    if (!machine || !machine.active) {
      error.message = 'La máquina de almacén no fue encontrada';
      throw error;
    }
    if (!['ALMACENADA', 'ACONDICIONADA'].includes(machine.status)) {
      error.message = 'Solo se pueden desmantelar máquinas con estado ALMACENADA o ACONDICIONADA';
      throw error;
    }

    machine.status = 'DESMANTELADA';
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;

    await machine.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return machine;
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al desmantelar la máquina. Intente de nuevo.'
      );
    }
  }
}



/**
 * DELETE - Soft delete warehouse machine
 */
export async function deleteWarehouseMachineData({ machineId, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  if (!isConnected()) {
    await connectToDatabase();
  }
  try {
    const machine = await WarehouseMachine.findById(machineId);
    if (!machine) {
      error.message = 'La máquina no fue encontrada';
      throw error;
    }
    machine.active = false;
    machine.updatedAt = Date.now();
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save();
    return true;
  } catch (e) {
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al eliminar la máquina del almacén. Intente de nuevo.'
      );
    }
  }
}

/**
 * MOVE TO SALE - Create SalesMachine from ACONDICIONADA warehouse machine
 */
export async function moveToSaleData({
  warehouseMachineId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    const machine = await WarehouseMachine.findById(warehouseMachineId);
    if (!machine || !machine.active) {
      error.message = 'La máquina de almacén no fue encontrada';
      throw error;
    }
    if (machine.status !== 'ACONDICIONADA') {
      error.message = 'Solo se pueden pasar a venta máquinas con estado ACONDICIONADA';
      throw error;
    }

    // Auto-increment machineNum for SalesMachine
    const lastSalesMachine = await SalesMachine.findOne().sort({ machineNum: -1 }).lean();
    const machineNum = lastSalesMachine ? lastSalesMachine.machineNum + 1 : 1;

    // Determine origin based on warehouse machine origin
    const salesOrigin = machine.origin === 'NUEVA' ? 'NUEVA' : 'REACONDICIONADA';

    const lastCondRecord = await ConditioningRecord.findOne({ warehouseMachine: machine._id });
    // Create SalesMachine with conditioning photos
    const newSalesMachine = await new SalesMachine({
      machineNum,
      brand: machine.brand,
      cost: machine.cost || 0,
      serialNumber: machine.serialNumber || '',
      photosUrls: machine.conditioningPhotos || [],
      origin: salesOrigin,
      warehouseRef: machine._id,
      currentWarehouse: machine.currentWarehouse || null,
      latestTecCond: lastCondRecord ? lastCondRecord.technician : null,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
      active: true,
      isSold: false,
      status: 'DISPONIBLE'
    }).save({ session, new: true });

    // Update warehouse machine
    machine.status = 'CONVERTIDA_VENTA';
    machine.resultingSalesMachine = newSalesMachine._id;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return { warehouseMachine: machine, salesMachine: newSalesMachine };
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al pasar la máquina a venta. Intente de nuevo.'
      );
    }
  }
}

/**
 * GET inactive rental machines that can be replaced
 * Returns machines with active=false and machineNum > 0
 */
export async function getInactiveRentalMachinesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await Machine.find({ 
    active: false, 
    machineNum: { $gt: 0 },
    wasReplaced: { $ne: true } // Exclude machines that were already replaced
  })
    .select('_id machineNum brand')
    .sort({ machineNum: 1 })
    .lean();
  return machines;
}

/**
 * REPLACE RENTAL MACHINE - Create new Machine from ACONDICIONADA warehouse machine
 * to replace an inactive rental machine
 */
export async function replaceRentalMachineData({
  warehouseMachineId,
  machineToReplaceId,
  warehouseId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    await session.startTransaction();
    const currentDate = Date.now();

    // Validate warehouse machine
    const warehouseMachine = await WarehouseMachine.findById(warehouseMachineId);
    if (!warehouseMachine || !warehouseMachine.active) {
      error.message = 'La máquina de almacén no fue encontrada';
      throw error;
    }
    if (warehouseMachine.status !== 'ACONDICIONADA') {
      error.message = 'Solo se pueden usar máquinas con estado ACONDICIONADA';
      throw error;
    }

    // Validate machine to replace
    const machineToReplace = await Machine.findById(machineToReplaceId);
    if (!machineToReplace) {
      error.message = 'La máquina a reemplazar no fue encontrada';
      throw error;
    }
    if (machineToReplace.active) {
      error.message = 'La máquina a reemplazar aún está activa';
      throw error;
    }
    if (!machineToReplace.machineNum || machineToReplace.machineNum <= 0) {
      error.message = 'La máquina a reemplazar no tiene un número válido';
      throw error;
    }

    // Get LISTO status
    const listoStatus = await MachineStatus.findOne({ id: MACHINE_STATUS_LIST.LISTO });
    if (!listoStatus) {
      error.message = 'No se encontró el estado LISTO';
      throw error;
    }

    // Create new Machine with same machineNum
    const newMachine = await new Machine({
      machineNum: machineToReplace.machineNum,
      brand: warehouseMachine.brand,
      capacity: '18 kg',
      cost: warehouseMachine.cost || 0,
      expenses: 0,
      earnings: 0,
      status: listoStatus._id,
      currentWarehouse: warehouseId,
      currentVehicle: null,
      lastRent: null,
      movements: [],
      totalChanges: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
      partner: null,
      evidencesUrls: warehouseMachine.conditioningPhotos || [],
      warranty: null,
      active: true,
      fromWarehouseMachine: warehouseMachine._id,
      wasReplaced: false
    }).save({ session, new: true });

    // Transfer partner from replaced machine to the new machine
    await transferMachinePartnerData({ prevMachine: machineToReplace, newMachine, session });

    const newMachineMov = await new MachineMovement({
      machine: newMachine._id,
      type: MACHINE_MOVEMENT_LIST.NEW,
      description: 'Ingreso',
      amount: -warehouseMachine.cost || 0,
      date: currentDate
    }).save({ session, new: true });

    newMachine.movements.push(newMachineMov._id);
    await newMachine.save({ session });

    // Mark old machine as replaced (partner is now null after transfer)
    machineToReplace.wasReplaced = true;
    machineToReplace.updatedAt = currentDate;
    machineToReplace.lastUpdatedBy = lastUpdatedBy;
    await machineToReplace.save({ session });
    // Update warehouse machine
    warehouseMachine.status = WAREHOUSE_MACHINE_STATUS.DE_REEMPLAZO;
    warehouseMachine.resultingMachine = newMachine._id;
    warehouseMachine.updatedAt = currentDate;
    warehouseMachine.lastUpdatedBy = lastUpdatedBy;
    await warehouseMachine.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return { 
      warehouseMachine, 
      newMachine, 
      replacedMachine: machineToReplace 
    };
  } catch (e) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al reemplazar la máquina. Intente de nuevo.'
      );
    }
  }
}
