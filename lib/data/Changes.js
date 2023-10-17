import mongoose from 'mongoose';
import { connectToDatabase, isConnected } from '../db';
import { getFileExtension, getTimeFromDate } from '../client/utils';
import { Rent } from '../models/Rent';
import { RentStatus } from '../models/RentStatus';
import { Machine } from '../models/Machine';
import { MachineStatus } from '../models/MachineStatus';
import { RentChange } from '../models/RentChange';
import { Residence } from '../models/Residence';
import { Customer } from '../models/Customer';
import { CustomerMovement } from '../models/CustomerMovement';
import { City } from '../models/City';
import { Sector } from '../models/Sector';
import { ACCESORIES_LIST, MACHINE_MOVEMENT_LIST } from '../consts/OBJ_CONTS';
import dayjs from 'dayjs';
import { uploadFile } from '../cloud';
import { Vehicle } from '../models/Vehicle';
import { MachineMovement } from '../models/MachineMovement';
import { User } from '../models/User';
Residence.init();
City.init();
Sector.init();
Customer.init();
Rent.init();

const getNextChangeTotalNumber = async () => {
  const totalChanges = await RentChange.find({
    status: { $ne: 'REPROGRAMADO' }
  });
  return totalChanges.length + 1;
};
const getNextChangeDayNumber = async (changeDate) => {
  const start = dayjs(changeDate).startOf('day');
  const end = dayjs(changeDate).endOf('day');
  const todayChanges = await RentChange.find({
    date: { $gte: start, $lt: end },
    status: { $ne: 'REPROGRAMADO' }
  });
  return todayChanges.length + 1;
};

export async function saveChangeData({
  rentId,
  changeTime,
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
    let rent = await Rent.findById(rentId).populate('status');
    if (!rent || rent.status.id !== 'RENTADO') {
      error.message = 'La renta indicada no es válida';
      throw error;
    }

    const onChangeStatus = await RentStatus.findOne({ id: 'EN_CAMBIO' });
    rent.status = onChangeStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });

    let date = new Date(changeTime.date);
    let fromTime = new Date(changeTime.date);
    let endTime = new Date(changeTime.date);
    if (changeTime.timeOption === 'any') {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(changeTime.fromTime));
      const endT = getTimeFromDate(new Date(changeTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }
    // Get next change number (by current day)
    const totalNumber = await getNextChangeTotalNumber();
    // Get next change number (by current day)
    const dayNumber = await getNextChangeDayNumber(new Date(changeTime.date));
    const change = await new RentChange({
      totalNumber,
      dayNumber,
      rent,
      date,
      reason,
      timeOption: changeTime.timeOption,
      fromTime,
      endTime,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    return change;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al guardar el cambio. Intente de nuevo.'
      );
    }
  }
}
export async function getPastChangesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const pastChanges = await RentChange.find({
    status: { $in: ['FINALIZADO', 'CANCELADO'] }
  })
    .populate([
      {
        path: 'rent',
        populate: {
          path: 'customer',
          populate: 'currentResidence'
        }
      },
      'pickedMachine',
      'leftMachine'
    ])
    .sort({ createdAt: -1 })
    .exec();
  return pastChanges.sort((a, b) => {
    if (a.status === "CANCELADO" && b.status === "CANCELADO") {
      return b.updatedAt - a.updatedAt; // Sort by updatedAt in descending order for CANCELADO
    }
    if (a.status === "FINALIZADO" && b.status === "FINALIZADO") {
      return b.finishedAt - a.finishedAt; // Sort by finishedAt in descending order for FINALIZADO
    }
    if (a.status === "FINALIZADO" && b.status === "CANCELADO") {
      return b.updatedAt - a.finishedAt; // Sort by finishedAt in descending order for FINALIZADO
    }
    if (a.status === "CANCELADO" && b.status === "FINALIZADO") {
      return b.finishedAt - a.updatedAt; // Sort by finishedAt in descending order for FINALIZADO
    }
  });
}
export async function getPendingChangesData(userId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const user = await User.findById(userId).populate('role').lean();
  let filter = { status: { $in: ['ESPERA', 'EN_CAMINO', 'EN_DOMICILIO'] } };
  if (user.role.id === 'OPE') {
    filter.operator = userId;
  }
  const pendingChanges = await RentChange.find(filter)
    .populate([
      { path: 'operator', select: '_id name' },
      {
        path: 'rent',
        populate: [
          {
            path: 'customer',
            populate: {
              path: 'currentResidence',
              populate: ['city', 'sector']
            }
          },
          {
            path: 'machine'
          }
        ]
      }
    ])
    .sort({ date: 1 })
    .exec();
  return pendingChanges;
}

export async function getChangeData(changeId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const change = await RentChange.findById(changeId)
    .populate([
      {
        path: 'rent',
        populate: [
          {
            path: 'customer',
            model: 'customers',
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
          },
          'machine'
        ]
      }
    ])
    .exec();
  return change;
}

export async function markCompleteChangeData({
  changeId,
  wasFixed,
  problemDesc,
  solutionDesc,
  newMachine,
  changedAccesories,
  files,
  changeDate,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let change = await RentChange.findById(changeId).populate({
      path: 'operator',
      select: 'name'
    });
    if (!change || !['ESPERA', 'EN_CAMINO'].includes(change.status)) {
      error.message = 'El cambio indicado no existe o no tiene estatus válido';
      throw error;
    }

    let rent = await Rent.findById(change.rent);
    let rentAccesories = rent.accesories;
    let customer = await Customer.findById(rent.customer);
    if (!wasFixed) {
      const collectedStatus = await MachineStatus.findOne({ id: 'REC' });
      //Get vehicle from operator
      let vehicle = await Vehicle.findOne({ operator: change.operator._id });

      let prevMachine = await Machine.findById(rent.machine);
      prevMachine.status = collectedStatus;
      prevMachine.currentVehicle = vehicle._id;
      prevMachine.currentWarehouse = null;
      prevMachine.totalChanges = prevMachine.totalChanges + 1;
      prevMachine.updatedAt = currentDate;
      prevMachine.lastUpdatedBy = lastUpdatedBy;
      await prevMachine.save({ session, new: false });
      vehicle.machinesOn.push(prevMachine._id);
      await vehicle.save({ session, new: false });
      change.pickedMachine = prevMachine;
      // Left machine
      let machine = await Machine.findById(newMachine).populate('status');
      if (!machine || !['LISTO', 'REC', 'VEHI'].includes(machine.status.id)) {
        error.message = 'El equipo indicado no esta disponible para dejar';
        throw error;
      }
      const rentMachineStatus = await MachineStatus.findOne({ id: 'RENTADO' });
      machine.status = rentMachineStatus._id;
      machine.lastRent = rent._id;
      machine.updatedAt = currentDate;
      machine.currentWarehouse = null;
      if (machine.currentVehicle) {
        if (machine.currentVehicle.toString() !== vehicle._id.toString())
          vehicle = await Vehicle.findById(machine.currentVehicle);
        const machines = vehicle?.machinesOn.filter(
          (machOn) => machOn.toString() !== machine._id.toString()
        );
        vehicle.machinesOn = machines;
        await vehicle.save({ session, new: false });
      }
      machine.currentVehicle = null;
      const newChangeMachineMov = await new MachineMovement({
        machine,
        type: MACHINE_MOVEMENT_LIST.CHANGE,
        description: `Colocada por cambio de equipo`,
        amount: 0,
        date: changeDate
      }).save({ session, new: true });
      machine.movements.push(newChangeMachineMov);
      machine.lastUpdatedBy = lastUpdatedBy;
      await machine.save({ session, new: false });
      const customerMovement = await new CustomerMovement({
        customer,
        rent: rent._id,
        machine: newMachine,
        type: 'CHANGE',
        description: `Cambio de equipo`,
        date: changeDate
      }).save({ session, new: true });
      customer.movements.push(customerMovement);
      rent.machine = machine;
      change.leftMachine = machine;
    } else {
      Object.keys(changedAccesories).forEach((key) => {
        if (changedAccesories[key] && ACCESORIES_LIST[key]) {
          rentAccesories[key] = true;
        }
      });

      rent.accesories = rentAccesories;
    }
    const onRentStatus = await RentStatus.findOne({ id: 'RENTADO' });
    rent.status = onRentStatus;
    rent.totalChanges = rent.totalChanges + 1;
    rent.consecutiveChanges = rent.consecutiveChanges + 1;
    if (rent.consecutiveChanges >= 4) {
      customer.freeWeeks = customer.freeWeeks + 1;
      rent.consecutiveChanges = 0;
    }

    await customer.save({ session, new: false });
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.updateOne(rent, { session, new: false });

    change.status = 'FINALIZADO';
    change.wasFixed = wasFixed;
    change.problemDesc = problemDesc;
    change.solutionDesc = wasFixed ? solutionDesc : null;
    change.changedAccesories = changedAccesories;
    change.finishedAt = changeDate;
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    if (!wasFixed) {
      // Save attachments on cloud and change object
      let imagesUrl = {};
      for (const [key] of Object.entries(files)) {
        const fileName = `change_${key}_${
          change.totalNumber
        }.${getFileExtension(files[key].originalFilename)}`;
        const url = await uploadFile(files[key].filepath, fileName);
        imagesUrl[key] = url;
      }
      change.imagesUrl = imagesUrl;
    }
    await change.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al completar el cambio. Intente de nuevo.'
      );
    }
  }
}

export async function updateChangeTimeData({
  changeId,
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
    let change = await RentChange.findById(changeId);
    if (!change) {
      error.message = 'No se encontró el cambio indicado.';
      throw error;
    }
    if (change.wasSent) {
      // Save another change with previous data for reports
      await new RentChange({
        totalNumber: change.totalNumber,
        dayNumber: change.dayNumber,
        rent: change.rent,
        status: 'REPROGRAMADO',
        takenAt: change.takenAt,
        takenBy: change.takenBy,
        date: change.date,
        timeOption: change.timeOption,
        fromTime: change.fromTime,
        endTime: change.endTime,
        wasSent: true,
        reason: change.reason,
        createdAt: currentDate,
        updatedAt: currentDate,
        lastUpdatedBy: lastUpdatedBy
      }).save({ session, new: true });
    }
    let date = new Date(changeTime.date);
    let fromTime = new Date(changeTime.date);
    let endTime = new Date(changeTime.date);
    if (changeTime.timeOption === 'any') {
      date.setHours(23, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(changeTime.fromTime));
      const endT = getTimeFromDate(new Date(changeTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }
    change.date = date;
    change.timeOption = changeTime.timeOption;
    change.fromTime = fromTime;
    change.endTime = endTime;
    change.wasSent = false;
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar el cambio. Intente de nuevo.'
      );
    }
  }
}

export async function cancelChangeData({
  changeId,
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
    let change = await RentChange.findById(changeId);
    if (!change) {
      error.message = 'No se encontró el cambio indicado.';
      throw error;
    }
    const onRentStatus = await RentStatus.findOne({ id: 'RENTADO' });
    let rent = await Rent.findById(change.rent);
    rent.status = onRentStatus;
    rent.updatedAt = currentDate;
    rent.lastUpdatedBy = lastUpdatedBy;
    await rent.save({ session, new: false });
    change.cancellationReason = cancellationReason;
    change.status = 'CANCELADO';
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al cancelar el cambio. Intente de nuevo.'
      );
    }
  }
}

export async function setChangeSentData({ changeId, wasSent, lastUpdatedBy }) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    let change = await RentChange.findById(changeId);
    if (!change) {
      error.message = 'No se encontró el cambio indicado.';
      throw error;
    }
    change.wasSent = wasSent;
    change.updatedAt = currentDate;
    change.lastUpdatedBy = lastUpdatedBy;
    await change.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al actualizar el cambio. Intente de nuevo.'
      );
    }
  }
}
