import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { SalesMachine } from '../models/SalesMachine';
import { getFileExtension } from '../client/utils';
import { uploadFile } from '../cloud';

export async function getSalesMachinesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const salesMachinesList = await SalesMachine.find({ 
    active: true,
    isSold: false,
    status: 'DISPONIBLE'
  }).sort({
    machineNum: 1
  });
  return salesMachinesList;
}

export async function getAllSalesMachinesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const salesMachinesList = await SalesMachine.find({ 
    active: true
  }).sort({
    machineNum: 1
  });
  return salesMachinesList;
}

export async function getSalesMachineByIdData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const salesMachineDetail = await SalesMachine.findById(id)
    .lean();
  
  return salesMachineDetail;
}

export async function saveSalesMachineData({
  machineNum,
  brand,
  capacity,
  cost,
  serialNumber,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const existingMachine = await SalesMachine.findOne({ machineNum });
    if (existingMachine) {
      error.message = 'Ya existe un equipo de venta con el número ' + machineNum;
      throw error;
    }
    await session.startTransaction();
    let newSalesMachine = await new SalesMachine({
      machineNum,
      brand,
      capacity,
      cost,
      serialNumber: serialNumber || '',
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
      active: true,
      isSold: false,
      status: 'DISPONIBLE'
    }).save({ session, new: true });
    
    await session.commitTransaction();
    await session.endSession();
    return true;
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
        'Ocurrió un error al guardar el equipo de venta. Intente de nuevo.'
      );
    }
  }
}

export async function updateSalesMachineData({
  _id,
  files,
  machineNum,
  cost,
  brand,
  capacity,
  serialNumber,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!isConnected()) {
      await connectToDatabase();
    }
    const existingSalesMachine = await SalesMachine.findOne({ machineNum });
    if (
      existingSalesMachine &&
      existingSalesMachine?._id?.toString() !== _id.toString()
    ) {
      error.message = 'Ya existe un equipo de venta con el mismo número';
      throw error;
    }
    
    const salesMachineToUpdate = await SalesMachine.findById(_id);
    if (!salesMachineToUpdate) {
      error.message = 'El equipo de venta no existe';
      throw error;
    }

    let evidencesUrls = salesMachineToUpdate.evidencesUrls || [];
    if (files?.evidence) {
      // Save attachments on cloud and change object
      const fileName = `sales_machine_evidence_${new Date().getTime()}.${getFileExtension(
        files.evidence.originalFilename
      )}`;
      const url = await uploadFile(files.evidence.filepath, fileName);
      evidencesUrls.push(url);
    }

    await SalesMachine.findByIdAndUpdate(
      _id,
      {
        machineNum,
        brand,
        cost,
        capacity,
        serialNumber: serialNumber || '',
        lastUpdatedBy,
        evidencesUrls,
        updatedAt: currentDate
      },
      { session, new: false }
    );
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.log(e.message);
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error(
        'Ocurrió un error al actualizar el equipo de venta. Intente de nuevo.'
      );
  }
}

export async function deleteSalesMachinesData({ arrayOfIds, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!arrayOfIds || !arrayOfIds.length) {
      throw new Error(
        'Los datos enviados no son correctos. Por favor intente de nuevo'
      );
    }
    if (!isConnected()) {
      await connectToDatabase();
    }
    for (let i = 0; i < arrayOfIds.length; i++) {
      let machineToDelete = await SalesMachine.findById(arrayOfIds[i]);
      if (!machineToDelete) {
        error.message = 'Uno o más equipos de venta no existen.';
        throw error;
      }
      if (machineToDelete.isSold) {
        error.message = 'Uno o más equipos de venta ya fueron vendidos.';
        throw error;
      }
      if (machineToDelete.status === 'PENDIENTE') {
        error.message = 'Uno o más equipos tienen una entrega pendiente.';
        throw error;
      }
      machineToDelete.active = false;
      machineToDelete.updatedAt = currentDate;
      machineToDelete.lastUpdatedBy = lastUpdatedBy;
      await machineToDelete.save({ session, new: false });
    }
    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error('Ocurrió un error al eliminar equipo de venta. Intente de nuevo.');
  }
}

export async function markSalesMachineAsSold({ machineId, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!isConnected()) {
      await connectToDatabase();
    }
    
    const machine = await SalesMachine.findById(machineId);
    if (!machine) {
      error.message = 'El equipo de venta no existe';
      throw error;
    }
    
    if (machine.isSold) {
      error.message = 'Este equipo ya fue marcado como vendido';
      throw error;
    }

    machine.isSold = true;
    machine.status = 'VENDIDO';
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error('Ocurrió un error al marcar el equipo como vendido. Intente de nuevo.');
  }
}

export async function markSalesMachineAsPending({ machineId, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!isConnected()) {
      await connectToDatabase();
    }
    
    const machine = await SalesMachine.findById(machineId);
    if (!machine) {
      error.message = 'El equipo de venta no existe';
      throw error;
    }
    
    if (machine.isSold) {
      error.message = 'Este equipo ya fue vendido';
      throw error;
    }

    if (machine.status === 'PENDIENTE') {
      error.message = 'Este equipo ya tiene una entrega pendiente';
      throw error;
    }

    machine.status = 'PENDIENTE';
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error('Ocurrió un error al marcar el equipo como pendiente. Intente de nuevo.');
  }
}
