import { connectToDatabase, isConnected } from '../db';
import { ExtraTrip } from '../models/ExtraTrip';
import { User } from '../models/User';
import { setDateToInitial, setDateToEnd, dateFromString } from '../client/utils';

// Initialize models
ExtraTrip.init();
User.init();

export async function getExtraTripsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const trips = await ExtraTrip.find({})
    .populate([
      {
        path: 'assignedTo',
        select: 'name'
      },
      {
        path: 'createdBy',
        select: 'name'
      },
      {
        path: 'completedBy',
        select: 'name'
      }
    ])
    .sort({ createdAt: -1 })
    .lean();

  return trips;
}

export async function getPendingExtraTrips() {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const trips = await ExtraTrip.find({
    status: { $in: ['PENDIENTE', 'ASIGNADA'] }
  })
    .populate([
      {
        path: 'assignedTo',
        select: 'name'
      },
      {
        path: 'createdBy',
        select: 'name'
      }
    ])
    .sort({ scheduledTime: 1, createdAt: 1 })
    .lean();

  return trips;
}

export async function getPendingExtraTripsForOperator(operatorId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const trips = await ExtraTrip.find({
    status: 'ASIGNADA',
    assignedTo: operatorId
  })
    .populate([
      {
        path: 'assignedTo',
        select: 'name'
      },
      {
        path: 'createdBy',
        select: 'name'
      }
    ])
    .sort({ scheduledTime: 1, createdAt: 1 })
    .lean();

  return trips;
}

export async function getCompletedExtraTrips(date) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const startDate = setDateToInitial(dateFromString(date));
  const endDate = setDateToEnd(startDate);

  const trips = await ExtraTrip.find({
    status: { $in: ['COMPLETADA', 'CANCELADA'] },
    $or: [
      { completedAt: { $gte: startDate, $lte: endDate } },
      { updatedAt: { $gte: startDate, $lte: endDate }, status: 'CANCELADA' }
    ]
  })
    .populate([
      {
        path: 'assignedTo',
        select: 'name'
      },
      {
        path: 'createdBy',
        select: 'name'
      },
      {
        path: 'completedBy',
        select: 'name'
      }
    ])
    .sort({ completedAt: -1 })
    .lean();

  return trips;
}

export async function getCompletedExtraTripsInRange(startDate, endDate) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const trips = await ExtraTrip.find({
    status: 'COMPLETADA',
    completedAt: { $gte: startDate, $lte: endDate }
  })
    .populate([
      {
        path: 'completedBy',
        select: 'name'
      }
    ])
    .lean();

  return trips;
}

export async function saveExtraTripData({
  destination,
  reason,
  notes,
  operatorId,
  scheduledTime,
  createdBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';

  if (!destination || !destination.trim()) {
    error.message = 'El destino es requerido';
    throw error;
  }

  if (!reason || !reason.trim()) {
    error.message = 'La razón es requerida';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    // Get the next trip number
    const lastTrip = await ExtraTrip.findOne().sort({ tripNumber: -1 }).lean();
    const tripNumber = lastTrip ? lastTrip.tripNumber + 1 : 1;

    // Verify operator if provided
    let operator = null;
    if (operatorId) {
      operator = await User.findById(operatorId).populate('role');
      if (!operator) {
        error.message = 'El operador seleccionado no existe';
        throw error;
      }
      if (operator.role?.id !== 'OPE') {
        error.message = 'El usuario seleccionado no es un operador';
        throw error;
      }
    }

    // Create new extra trip
    const newTrip = new ExtraTrip({
      tripNumber,
      destination: destination.trim(),
      reason: reason.trim(),
      notes: notes?.trim() || '',
      status: operatorId ? 'ASIGNADA' : 'PENDIENTE',
      assignedTo: operatorId || null,
      assignedBy: operatorId ? createdBy : null,
      assignedAt: operatorId ? currentDate : null,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy,
      lastUpdatedBy: createdBy
    });

    await newTrip.save({ session, isNew: true });

    await session.commitTransaction();
    await session.endSession();

    // Populate and return
    const populatedTrip = await ExtraTrip.findById(newTrip._id)
      .populate([
        {
          path: 'assignedTo',
          select: 'name'
        },
        {
          path: 'createdBy',
          select: 'name'
        }
      ])
      .lean();

    return populatedTrip;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al guardar la vuelta extra. Intente de nuevo.');
    }
  }
}

export async function assignExtraTrip({
  tripId,
  operatorId,
  assignedBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';

  if (!tripId || !operatorId) {
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const trip = await ExtraTrip.findById(tripId);
    if (!trip) {
      error.message = 'La vuelta extra no existe';
      throw error;
    }

    if (trip.status === 'COMPLETADA') {
      error.message = 'Esta vuelta ya fue completada';
      throw error;
    }

    if (trip.status === 'CANCELADA') {
      error.message = 'Esta vuelta fue cancelada';
      throw error;
    }

    // Verify operator
    const operator = await User.findById(operatorId).populate('role');
    if (!operator) {
      error.message = 'El operador seleccionado no existe';
      throw error;
    }

    if (operator.role?.id !== 'OPE') {
      error.message = 'El usuario seleccionado no es un operador';
      throw error;
    }

    trip.status = 'ASIGNADA';
    trip.assignedTo = operatorId;
    trip.assignedBy = assignedBy;
    trip.assignedAt = currentDate;
    trip.updatedAt = currentDate;
    trip.lastUpdatedBy = assignedBy;

    await trip.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al asignar la vuelta. Intente de nuevo.');
    }
  }
}

export async function completeExtraTrip({
  tripId,
  completionNotes,
  completedBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';

  if (!tripId) {
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const trip = await ExtraTrip.findById(tripId);
    if (!trip) {
      error.message = 'La vuelta extra no existe';
      throw error;
    }

    if (trip.status === 'COMPLETADA') {
      error.message = 'Esta vuelta ya fue completada';
      throw error;
    }

    if (trip.status === 'CANCELADA') {
      error.message = 'Esta vuelta fue cancelada';
      throw error;
    }

    trip.status = 'COMPLETADA';
    trip.completedAt = currentDate;
    trip.completedBy = completedBy;
    trip.completionNotes = completionNotes?.trim() || '';
    trip.updatedAt = currentDate;
    trip.lastUpdatedBy = completedBy;

    await trip.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al completar la vuelta. Intente de nuevo.');
    }
  }
}

export async function cancelExtraTrip({
  tripId,
  cancelledBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';

  if (!tripId) {
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const trip = await ExtraTrip.findById(tripId);
    if (!trip) {
      error.message = 'La vuelta extra no existe';
      throw error;
    }

    if (trip.status === 'COMPLETADA') {
      error.message = 'No se puede cancelar una vuelta completada';
      throw error;
    }

    if (trip.status === 'CANCELADA') {
      error.message = 'Esta vuelta ya fue cancelada';
      throw error;
    }

    trip.status = 'CANCELADA';
    trip.updatedAt = currentDate;
    trip.lastUpdatedBy = cancelledBy;

    await trip.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al cancelar la vuelta. Intente de nuevo.');
    }
  }
}
