import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { Machine } from "../models/Machine";
import { MachineMovement } from "../models/MachineMovement";
import { MachineStatus } from "../models/MachineStatus";
import { Warehouse } from "../models/Warehouse";
import { Vehicle } from "../models/Vehicle";
import {
  MACHINE_STATUS_LIST,
  MACHINE_MOVEMENT_LIST,
} from "../consts/OBJ_CONTS";
const PROTECTED_STATUS = [
  MACHINE_STATUS_LIST.VEHI,
  MACHINE_STATUS_LIST.RENTADO,
  MACHINE_STATUS_LIST.MANTE,
];
Warehouse.init();
Vehicle.init();

export async function getMachinesDataWithDetails() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machinesList = await Machine.find()
    .populate([
      "status",
      "currentWarehouse",
      "currentVehicle", //"movements", "lastRent"
    ])
    .exec();
  let foundVehicles = {};
  let foundWarehouses = {
    LISTO: {},
    ESPE: {},
    MANTE: {},
  };
  let details = {
    total: 0,

    RENT: {
      total: 0,
      byCity: [],
    },
    VEHI: {
      total: 0,
      byVehicle: [],
    },
    LISTO: {
      total: 0,
      byWarehouse: [],
    },
    ESPE: {
      total: 0,
      byWarehouse: [],
    },
    MANTE: {
      total: 0,
      byWarehouse: [],
    },
  };
  for (var i = 0; i < machinesList.length; i++) {
    if (machinesList[i]?.active) {
      details.total += 1;
      const machine = machinesList[i];
      const status = machine?.status?.id;
      switch (status) {
        case MACHINE_STATUS_LIST.RENTADO:
          {
            // TODO when implementing rents
            /*
          details.rent.total++;
          details.rent.*/
          }
          break;
        case MACHINE_STATUS_LIST.VEHI:
          {
            details.VEHI.total++;
            const vehicleId = machine?.currentVehicle?._id;
            if (!foundVehicles[vehicleId]) {
              foundVehicles[vehicleId] = details.VEHI.byVehicle.length + 1;
              details.VEHI.byVehicle.push({
                id: vehicleId,
                name: machine?.currentVehicle?.description,
                total: 1,
              });
            } else {
              details.VEHI.byVehicle[foundVehicles[vehicleId] - 1].total++;
            }
          }
          break;
        default: {
          const warehouseId = machine?.currentWarehouse?._id;
          details[status].total++;
          if (!foundWarehouses[status][warehouseId]) {
            foundWarehouses[status][warehouseId] =
              details[status].byWarehouse.length + 1;
            details[status].byWarehouse.push({
              id: warehouseId,
              name: machine?.currentWarehouse?.name,
              total: 1,
            });
          } else {
            details[status].byWarehouse[
              foundWarehouses[status][warehouseId] - 1
            ].total++;
          }
        }
      }
    }
  }
  const response = { machinesList, machinesSummary: details };
  return response;
}

export async function getMachinesForRentData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const readyStatus = await MachineStatus.findOne({ id: "LISTO" });
  const machinesList = await Machine.find({ status: readyStatus }).sort({
    machineNum: 1,
  });
  return machinesList;
}
export async function getMachineByIdData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machineDetail = await Machine.findById(id)
    .populate([
      "status",
      "currentWarehouse",
      "currentVehicle",
      "movements", //, "lastRent"
    ])
    .exec();
  return machineDetail;
}

export async function getMachineStatusData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machines = await MachineStatus.find();
  return machines;
}

export async function saveMachineData({
  machineNum,
  brand,
  capacity,
  cost,
  status,
  location,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  let machineStatus;
  let currentVehicle = null,
    currentWarehouse = null;
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    const existingMachine = await Machine.findOne({ machineNum });
    if (existingMachine) {
      error.message = "Ya existe un equipo con el número " + machineNum;
      throw error;
    }
    machineStatus = await MachineStatus.findById(status);
    if (!machineStatus) {
      error.message = "Indique una estado válido";
      throw error;
    }
    switch (machineStatus?.id) {
      case MACHINE_STATUS_LIST.VEHI:
        {
          currentVehicle = await Vehicle.findById(location);
          if (!currentVehicle) {
            error.message = "El vehículo indicado no existe";
            throw error;
          }
        }
        break;
      case MACHINE_STATUS_LIST.RENTADO:
        break;
      default: {
        currentWarehouse = await Warehouse.findById(location);
        if (!currentWarehouse) {
          error.message = "La bodega indicada no existe";
          throw error;
        }
      }
    }

    let newMachine = await new Machine({
      machineNum,
      brand,
      capacity,
      cost,
      expenses: cost,
      status,
      currentWarehouse,
      currentVehicle,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy,
    }).save({ session, new: true });
    if (machineStatus?.id === MACHINE_STATUS_LIST.VEHI) {
      currentVehicle.machinesOn.push(newMachine);
      await currentVehicle.save({ session, new: false });
    }
    const newMachineMov = await new MachineMovement({
      machine: newMachine,
      type: MACHINE_MOVEMENT_LIST.NEW,
      description: "Ingreso",
      amount: -cost,
      date: currentDate,
    }).save({ session, new: true });
    newMachine.movements.push(newMachineMov);
    await newMachine.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrío un error al guardar el equipo. Intente de nuevo."
      );
    }
  }
}
export async function updateMachineData({
  _id,
  machineNum,
  brand,
  capacity,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!isConnected()) {
      await connectToDatabase();
    }
    const existingMachine = await Machine.findOne({ machineNum });
    if (
      existingMachine &&
      existingMachine?._id?.toString() !== _id.toString()
    ) {
      error.message = "Ya existe un equipo con el mismo número";
      throw error;
    }
    await Machine.findByIdAndUpdate(
      _id,
      { machineNum, brand, capacity, lastUpdatedBy, updatedAt: currentDate },
      { session, new: false }
    );
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.log(e.message);
    await session.abortTransaction();
    await session.endSession();
    if (e.name === "Internal") throw e;
    else
      throw new Error(
        "Ocurrió un error al actualizar el equipo. Intente de nuevo."
      );
  }
}
export async function deleteMachinesData({ arrayOfIds, lastUpdatedBy }) {
  let error = new Error();
  error.name = "Internal";
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!arrayOfIds || !arrayOfIds.length) {
      throw new Error(
        "Los datos enviados no son correctos. Por favor intente de nuevo"
      );
    }
    if (!isConnected()) {
      await connectToDatabase();
    }
    for (let i = 0; i < arrayOfIds.length; i++) {
      let machineToDelete = await Machine.findById(arrayOfIds[i])
        .populate("status")
        .exec();
      if (!machineToDelete) {
        error.message = "Uno o más equipos no existen.";
        throw error;
      }
      if (PROTECTED_STATUS.includes(machineToDelete?.status?.id)) {
        error.message = "Uno o más equipos estan en uso.";
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
    if (e.name === "Internal") throw e;
    else
      throw new Error("Ocurrió un error al eliminar equipo. Intente de nuevo.");
  }
}