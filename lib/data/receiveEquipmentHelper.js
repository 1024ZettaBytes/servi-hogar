import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { Machine } from '../models/Machine';
import { MachineStatus } from '../models/MachineStatus';
import { Warehouse } from '../models/Warehouse';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Mantainance } from '../models/Mantainance';
import { getNextMantId } from './Mantainances';
import { MACHINE_STATUS_LIST } from '../consts/OBJ_CONTS';

export async function receiveCollectedEquipmentData({ machineId, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }

    // Find the machine
    const machine = await Machine.findById(machineId).populate('status');
    if (!machine) {
      error.message = 'Equipo no encontrado';
      throw error;
    }

    // Verify machine is in REC status
    const recStatus = await MachineStatus.findOne({ id: 'REC' });
    if (!recStatus || machine.status._id.toString() !== recStatus._id.toString()) {
      error.message = 'El equipo no está en estado recolectado';
      throw error;
    }

    // Find "Bodega Principal" warehouse (case-insensitive, allows extra text)
    const bodegaPrincipal = await Warehouse.findOne({ name: /Bodega Principal/i });
    if (!bodegaPrincipal) {
      error.message = 'Bodega Principal no encontrada';
      throw error;
    }

    // Find "ESPE" status (waiting for maintenance)
    const espeStatus = await MachineStatus.findOne({ id: MACHINE_STATUS_LIST.ESPE });
    if (!espeStatus) {
      error.message = 'Estado ESPE no encontrado';
      throw error;
    }

    // If machine has a vehicle, remove it from vehicle's machinesOn
    if (machine.currentVehicle) {
      const vehicle = await Vehicle.findById(machine.currentVehicle);
      if (vehicle) {
        vehicle.machinesOn = vehicle.machinesOn.filter(
          (m) => m.toString() !== machine._id.toString()
        );
        await vehicle.save({ session, new: false });
      }
    }

    // Find technician to assign maintenance
    const tecRole = await Role.findOne({ id: 'TEC' });
    let tecnician = await User.findOne({
      role: tecRole._id,
      isActive: true,
      startM: { $lte: machine.machineNum },
      endM: { $gt: machine.machineNum }
    });
    
    if (!tecnician) {
      // If no technician found by machine range, find any active technician
      tecnician = await User.findOne({
        role: tecRole._id,
        isActive: true
      });
    }
    
    if (!tecnician) {
      error.message = 'No se encontró un técnico disponible para asignar. Por favor, cree uno.';
      throw error;
    }

    // Create maintenance record
    await new Mantainance({
      totalNumber: await getNextMantId(),
      machine: machine._id,
      takenBy: tecnician._id,
      takenAt: currentDate,
      status: 'PENDIENTE',
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy: lastUpdatedBy
    }).save({ session, new: true });

    // Update machine
    machine.status = espeStatus._id;
    machine.currentWarehouse = bodegaPrincipal._id;
    machine.currentVehicle = null;
    machine.updatedAt = currentDate;
    machine.lastUpdatedBy = lastUpdatedBy;
    await machine.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return machine;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al recibir el equipo. Intente de nuevo.'
      );
    }
  }
}
