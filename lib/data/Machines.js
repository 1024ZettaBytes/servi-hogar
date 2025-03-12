import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { connectToDatabase, isConnected } from '../db';
import { Machine } from '../models/Machine';
import { MachineMovement } from '../models/MachineMovement';
import { MachineStatus } from '../models/MachineStatus';
import { Warehouse } from '../models/Warehouse';
import { Vehicle } from '../models/Vehicle';
import { Rent } from '../models/Rent';
import { Customer } from '../models/Customer';
import { Residence } from '../models/Residence';
import { City } from '../models/City';
import { Partner } from '../models/Partner';
import { RentStatus } from '../models/RentStatus';

import {
  MACHINE_STATUS_LIST,
  MACHINE_MOVEMENT_LIST
} from '../consts/OBJ_CONTS';
import { RentPickup } from '../models/RentPickup';
import { dateDiffInDays, getFileExtension, getFileFromUrl } from '../client/utils';
import { deleteFile, uploadFile } from '../cloud';
import { CustomerMovement } from '../models/CustomerMovement';
import { User } from '../models/User';
const PROTECTED_STATUS = [
  MACHINE_STATUS_LIST.VEHI,
  MACHINE_STATUS_LIST.RENTADO,
  MACHINE_STATUS_LIST.MANTE
];
Rent.init();
Customer.init();
Residence.init();
City.init();
Warehouse.init();
Vehicle.init();
CustomerMovement.init();

export async function getMachinesDataWithDetails() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machinesList = await Machine.find()
    .populate([
      'status',
      'currentWarehouse',

      {
        path: 'currentVehicle',
        populate: {
          path: 'operator',
          select: 'name'
        }
      }, //"movements",
      {
        path: 'lastRent',
        populate: {
          path: 'customer',
          populate: {
            path: 'currentResidence',
            populate: {
              path: 'city'
            }
          }
        }
      }
    ])
    .sort({ machineNum: 1 })
    .lean();
  let foundVehicles = {};
  let foundCities = {};
  let foundWarehouses = {
    LISTO: {},
    ESPE: {},
    MANTE: {},
    REC: {}
  };
  let details = {
    total: 0,
    PERDIDA: {
      total: 0
    },
    RENT: {
      total: 0,
      byCity: []
    },
    VEHI: {
      total: 0,
      byVehicle: []
    },
    LISTO: {
      total: 0,
      byWarehouse: []
    },
    ESPE: {
      total: 0,
      byWarehouse: []
    },
    MANTE: {
      total: 0,
      byWarehouse: []
    },
    REC: {
      total: 0,
      byWarehouse: []
    }
  };
  for (var i = 0; i < machinesList.length; i++) {
    if (machinesList[i]?.active) {
      details.total += 1;
      const machine = machinesList[i];
      const status = machine?.status?.id;
      switch (status) {
        case MACHINE_STATUS_LIST.PERDIDA:
          {
            details.PERDIDA.total++;
          }
          break;
        case MACHINE_STATUS_LIST.RENTADO:
          {
            details.RENT.total++;
            const city = machine?.lastRent?.customer?.currentResidence?.city;
            if (!foundCities[city?.id]) {
              foundCities[city?.id] = details.RENT.byCity.length + 1;
              details.RENT.byCity.push({
                id: city?.id,
                name: city?.name,
                total: 1
              });
            } else {
              details.RENT.byCity[foundCities[city?.id] - 1].total++;
            }
          }
          break;
        case MACHINE_STATUS_LIST.VEHI:
        case MACHINE_STATUS_LIST.REC:
          {
            details.VEHI.total++;
            const vehicleId = machine?.currentVehicle?._id;
            if (!foundVehicles[vehicleId]) {
              foundVehicles[vehicleId] = details.VEHI.byVehicle.length + 1;
              details.VEHI.byVehicle.push({
                id: vehicleId,
                name: machine?.currentVehicle?.operator?.name,
                total: 1
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
              total: 1
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
  let validStatuses = await MachineStatus.find({
    id: 'VEHI'
  });
  let validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);
  const machinesList = await Machine.find({ status: { $in: validIds } }).sort({
    machineNum: 1
  });
  return machinesList;
}
export async function getMachineByIdData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const machineDetail = await Machine.findById(id)
    .populate([
      'status',
      'currentWarehouse',
      {
        path: 'currentVehicle',
        populate: {
          path: 'operator',
          select: 'name'
        }
      },
      {
        path: 'movements',
        options: { sort: { date: -1 } }
      },
      'lastRent'
    ])
    .lean();
  return machineDetail;
}

export async function getMachineStatusData(userRole) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const filter = userRole !== 'ADMIN' ? { id: { $ne: 'PERDIDA' } } : {};
  const machines = await MachineStatus.find(filter);
  return machines;
}

export async function saveMachineData({
  machineNum,
  brand,
  capacity,
  cost,
  status,
  location,
  partner,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let machineStatus;
  let currentVehicle = null,
    currentWarehouse = null;
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const existingMachine = await Machine.findOne({ machineNum });
    if (existingMachine) {
      error.message = 'Ya existe un equipo con el número ' + machineNum;
      throw error;
    }
    machineStatus = await MachineStatus.findById(status);
    if (!machineStatus) {
      error.message = 'Indique una estado válido';
      throw error;
    }
    switch (machineStatus?.id) {
      case MACHINE_STATUS_LIST.VEHI:
        {
          currentVehicle = await Vehicle.findById(location);
          if (!currentVehicle) {
            error.message = 'El vehículo indicado no existe';
            throw error;
          }
        }
        break;
      case MACHINE_STATUS_LIST.RENTADO:
        break;
      default: {
        currentWarehouse = await Warehouse.findById(location);
        if (!currentWarehouse) {
          error.message = 'La bodega indicada no existe';
          throw error;
        }
      }
    }
    await session.startTransaction();
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
      lastUpdatedBy
    }).save({ session, new: true });
    if (machineStatus?.id === MACHINE_STATUS_LIST.VEHI) {
      currentVehicle.machinesOn.push(newMachine);
      await currentVehicle.save({ session, new: false });
    }
    const newMachineMov = await new MachineMovement({
      machine: newMachine,
      type: MACHINE_MOVEMENT_LIST.NEW,
      description: 'Ingreso',
      amount: -cost,
      date: currentDate
    }).save({ session, new: true });
    newMachine.movements.push(newMachineMov);
    if (partner) {
      const selectedPartner = await Partner.findOne({ user: partner });
      if (!selectedPartner) {
        error.message = 'El socio indicado no existe';
        throw error;
      }
      selectedPartner.machines.push(newMachine._id);
      newMachine.partner = selectedPartner._id;
      await selectedPartner.save({ session, isNew: false });
    }
    await newMachine.save({ session, new: false });
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
        'Ocurrío un error al guardar el equipo. Intente de nuevo.'
      );
    }
  }
}
export async function updateMachineData({
  _id,
  files,
  machineNum,
  cost,
  brand,
  capacity,
  status,
  location,
  currentWarehouse: actualWarehouse,
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
    const existingMachine = await Machine.findOne({ machineNum }).populate([
      'currentWarehouse',
      'currentVehicle',
      'status'
    ]);
    if (
      existingMachine &&
      existingMachine?._id?.toString() !== _id.toString()
    ) {
      error.message = 'Ya existe un equipo con el mismo número';
      throw error;
    }
    const machineStatus = await MachineStatus.findById(status);
    if (!machineStatus) {
      error.message = 'Indique una estado válido';
      throw error;
    }
    let currentVehicle = existingMachine.currentVehicle;
    let currentWarehouse = existingMachine.currentWarehouse;
    if (
      currentVehicle !== null &&
      location &&
      location.toString() !== currentVehicle?._id.toString()
    ) {
      // Remove machine from current vehicle
      currentVehicle = await Vehicle.findById(currentVehicle._id);
      currentVehicle.machinesOn = currentVehicle.machinesOn.filter(
        (mac) => mac.toString() !== existingMachine._id.toString()
      );
      await currentVehicle.save({ session, new: false });
    }
    // Check if current status was REC or VEHI and new one is different, so pickup photo(s) are deleted
    if (
      ['REC', 'VEHI'].includes(existingMachine.status.id) &&
      !['REC', 'VEHI'].includes(machineStatus.id)
    ) {
      const pickups = await RentPickup.find({ rent: existingMachine.lastRent });
      for (let i = 0; i < pickups.length; i++) {
        let pickup = pickups[i];
        const imgObj = pickup.imagesUrl;
        if (imgObj) {
          pickup.imagesUrl = null;
          await pickup.save({ session, new: false });
          for (const [key] of Object.entries(imgObj)) {
            const fileName = getFileFromUrl(imgObj[key]);
            await deleteFile(fileName);
          }
        }
      }
    }
    //
    switch (machineStatus?.id) {
      case MACHINE_STATUS_LIST.VEHI:
        {
          currentWarehouse = null;
          currentVehicle = await Vehicle.findById(location);
          if (!currentVehicle) {
            error.message = 'El vehículo indicado no existe';
            throw error;
          }
          currentVehicle.machinesOn.push(existingMachine);
          await currentVehicle.save({ session, new: false });
        }
        break;
      case MACHINE_STATUS_LIST.REC: {
        currentWarehouse = null;
        currentVehicle = null;
      }
      case MACHINE_STATUS_LIST.PERDIDA: {
        currentWarehouse = null;
        currentVehicle = null;
      }
      case MACHINE_STATUS_LIST.RENTADO:
        break;

      default: {
        currentVehicle = null;
        currentWarehouse = await Warehouse.findById(location);
        const userRole = (await User.findById(lastUpdatedBy).populate('role'))
          .role.id;
        if (
          userRole !== 'ADMIN' &&
          existingMachine.status.typeWarehouse &&
          machineStatus.typeWarehouse &&
          actualWarehouse._id !== currentWarehouse._id.toString()
        ) {
          error.message =
            'No tienes permisos suficientes para hacer este cambio.';
          throw error;
        }
        if (
          userRole !== 'ADMIN' &&
          !existingMachine.status.typeWarehouse &&
          machineStatus.typeWarehouse &&
          !currentWarehouse.name.includes('Bodega Principal')
        ) {
          error.message =
            'No tienes permisos suficientes para hacer este cambio.';
          throw error;
        }

        if (!currentWarehouse) {
          error.message = 'La bodega indicada no existe';
          throw error;
        }
      }
    }
    if (
      existingMachine.status.id === MACHINE_STATUS_LIST.REC &&
      machineStatus.id !== MACHINE_STATUS_LIST.REC
    ) {
      currentVehicle = null;
    }
    let evidencesUrls = existingMachine.evidencesUrls || [];
    if (files?.evidence) {
      // Save attachments on cloud and change object
      const fileName = `evidence_${new Date().getTime()}.${getFileExtension(
        files.evidence.originalFilename
      )}`;
      const url = await uploadFile(files.evidence.filepath, fileName);
      evidencesUrls.push(url);
    }
    await Machine.findByIdAndUpdate(
      _id,
      {
        machineNum,
        brand,
        cost,
        capacity,
        status,
        currentVehicle,
        currentWarehouse,
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
        'Ocurrió un error al actualizar el equipo. Intente de nuevo.'
      );
  }
}
export async function deleteMachinesData({ arrayOfIds, lastUpdatedBy }) {
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
      let machineToDelete = await Machine.findById(arrayOfIds[i])
        .populate('status')
        .exec();
      if (!machineToDelete) {
        error.message = 'Uno o más equipos no existen.';
        throw error;
      }
      if (PROTECTED_STATUS.includes(machineToDelete?.status?.id)) {
        error.message = 'Uno o más equipos estan en uso.';
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
      throw new Error('Ocurrió un error al eliminar equipo. Intente de nuevo.');
  }
}

export async function getMachinesReportData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let currentDate = new Date();
  const _1stDayMonth = dayjs(currentDate).startOf('month');
  const _lastDayMonth = dayjs(currentDate).endOf('month');
  let summary = {
    onLittleWarehouse: 0,
    lost: 0,
    withMovements: 0,
    noMovements: 0,
    total: 0
  };
  const machines = await Machine.find(
    { active: true },
    {},
    { sort: { machineNum: -1 } }
  )
    .select({ machineNum: 1 })
    .lean();
  const maxMachineNum = machines ? machines[0].machineNum : 0;
  let report = Array(maxMachineNum + 1).fill(null);
  const movs = await MachineMovement.find({
    type: { $ne: 'NEW' },
    date: { $gte: _1stDayMonth, $lte: _lastDayMonth }
  })
    .populate({ path: 'machine', select: { machineNum: 1 } })
    .select({ machine: 1 })
    .lean();
  for (let i = 0; i < movs.length; i++) {
    const machineNum = movs[i].machine.machineNum;
    report[machineNum] = { machineNum, hasMovements: true, exists: true };
  }

  const withBonus = await CustomerMovement.find({
    type: 'BONUS',
    date: { $gte: _1stDayMonth, $lte: _lastDayMonth }
  })
    .populate({ path: 'machine', select: { machineNum: 1 } })
    .select({ machine: 1 })
    .lean();
  for (let i = 0; i < withBonus.length; i++) {
    const machineNum = withBonus[i].machine.machineNum;
    report[machineNum] = { machineNum, hasMovements: true, exists: true };
  }

  for (let i = 0; i < machines.length; i++) {
    const machineN = machines[i];
    if (!report[machineN.machineNum])
      report[machineN.machineNum] = {
        machineNum: machineN.machineNum,
        exists: true
      };
  }
  for (let i = 0; i < report.length; i++) {
    if (!report[i]) report[i] = { machineNum: i, exists: false };
  }

  const littleWarehouseMachines = (
    await Machine.find()
      .select({ machineNum: 1, currentWarehouse: 1 })
      .populate([
        {
          path: 'currentWarehouse',
          match: {
            name: 'Bodega Chica GSV'
          },
          select: '_id name'
        }
      ])
      .lean()
  ).filter((m) => m.currentWarehouse !== null);
  for (let i = 0; i < littleWarehouseMachines.length; i++) {
    const machineN = littleWarehouseMachines[i];
    report[machineN.machineNum] = {
      ...report[machineN.machineNum],
      onLittleWarehouse: true
    };
  }

  const lostStatus = await MachineStatus.findOne({ id: 'PERDIDA' });
  const lostMachines = await Machine.find({ status: lostStatus })
    .select({ machineNum: 1, status: 1 })
    .lean();
  for (let i = 0; i < lostMachines.length; i++) {
    const machineN = lostMachines[i];
    report[machineN.machineNum] = {
      ...report[machineN.machineNum],
      isLost: true
    };
  }

  report.shift();
  summary.total =
    summary.withMovements +
    summary.noMovements +
    summary.onLittleWarehouse +
    summary.lost;
  report.forEach((m) => {
    if (m.onLittleWarehouse) {
      summary.onLittleWarehouse += 1;
      return;
    }
    if (m.isLost) {
      summary.lost += 1;
      return;
    }
    if (m.hasMovements) {
      summary.withMovements += 1;
      return;
    }
    if (m.exists && !m.hasMovements) summary.noMovements += 1;
  });
  summary.total =
    summary.withMovements +
    summary.noMovements +
    summary.onLittleWarehouse +
    summary.lost;
  return { list: report, summary };
}

export async function getOnRentMachinesReportData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let data = {
    less60: {
      total: 0,
      percentage: 0.0
    },
    less180: {
      total: 0,
      percentage: 0.0
    },
    less365: {
      total: 0,
      percentage: 0.0
    },
    more365: {
      total: 0,
      percentage: 0.0
    }
  };
  let currentDate = new Date();
  let validStatuses = await RentStatus.find({
    id: { $in: ['EN_RECOLECCION', 'EN_CAMBIO', 'RENTADO', 'VENCIDA'] }
  }).lean();
  let validIds = validStatuses.reduce((prev, curr) => {
    prev.push(curr._id);
    return prev;
  }, []);

  let rents = await Rent.find({
    status: { $in: validIds }
  })
    .select({ status: 1, startDate: 1 })
    .lean();

  for (let i in rents) {
    const rent = rents[i];
    const rentDays = dateDiffInDays(rent.startDate, currentDate);

    if (rentDays <= 60) {
      data.less60.total = data.less60.total + 1;
      continue;
    }
    if (rentDays <= 180) {
      data.less180.total = data.less180.total + 1;
      continue;
    }
    if (rentDays <= 365) {
      data.less365.total = data.less365.total + 1;
      continue;
    }
    data.more365.total = data.more365.total + 1;
  }

  for (let key in data) {
    data[key].percentage = (data[key].total * 100.0) / rents.length;
  }

  return data;
}
