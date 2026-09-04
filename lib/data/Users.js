import { connectToDatabase, isConnected } from '../db';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { RentDelivery } from '../models/RentDelivery';
import { RentChange } from '../models/RentChange';
import { RentPickup } from '../models/RentPickup';
import { ExtraTrip } from '../models/ExtraTrip';
import { SaleDelivery } from '../models/SaleDelivery';
import { Vehicle } from '../models/Vehicle';
import { City } from '../models/City';
import { Partner } from '../models/Partner';
import { Warehouse } from '../models/Warehouse'
import { Mantainance } from '../models/Mantainance';
import { Machine } from '../models/Machine';
import { SaleRepair } from '../models/SaleRepair';
import { UserUnlock } from '../models/UserUnlock';
import { setDateToEnd, setDateToInitial } from '../client/utils';
import { Rent } from '../models/Rent';
import { createReplacementToolAssignment } from './TechnicianTools';

User.init();
Warehouse.init();
export async function saveUserData({ id, password, name, role, replacedTechnicianId, callerUserId, warehouse }) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';
  if (!id || !password || !name || !role || password.trim().length < 7) {
    error.message = 'La contraseña debe ser de al menos 7 caractéres';
    throw error;
  }
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      error.message = `El usuario ${id} ya existe`;
      throw error;
    }
    const givenRole = await Role.findOne({ id: role });
    if (!givenRole) {
      error.message = `El rol ${role} no existe`;
      throw error;
    }
    const newUser = new User({ id, name, role: givenRole._id });
    if (warehouse) {
      newUser.warehouse = warehouse;
    }
    newUser.password = await newUser.encryptPassword(password);
    await session.startTransaction();
    await newUser.save({ session, isNew: true });
    if (role === 'OPE') {
      const city = await City.findOne({ id: 'GSV' });
      await new Vehicle({
        city: city._id,
        brand: 'testBrand',
        model: 'testModel',
        year: 2023,
        color: 'testColor',
        description: 'testDescription',
        operator: newUser
      }).save({ session, isNew: true });
    }
    if (role === 'PARTNER') {
      await new Partner({ user: newUser, createdAt: currentDate }).save({
        session,
        isNew: true
      });
    }
    // If TEC role and replacing another technician, auto-assign tools and transfer equipment range
    if (role === 'TEC' && replacedTechnicianId) {
      const replacedTech = await User.findById(replacedTechnicianId).session(session);
      if (replacedTech) {
        // Transfer startM and endM to the new technician
        if (replacedTech.startM > 0 && replacedTech.endM > 0) {
          newUser.startM = replacedTech.startM;
          newUser.endM = replacedTech.endM;
          replacedTech.startM = -1;
          replacedTech.endM = -1;
          await replacedTech.save({ session, new: false });
          await newUser.save({ session, new: false });
        }
      }
      await createReplacementToolAssignment({
        technicianId: newUser._id,
        replacedTechnicianId,
        assignedBy: callerUserId || newUser._id,
        session
      });
    }
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
      throw new Error(
        'Ocurrío un error al guardar el usuario. Intente de nuevo.'
      );
    }
  }
}
export async function getUsersData(role = null) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const users = await User.find(role ? { role: (await Role.findOne({ id: role }).lean())._id } : {})
    .select({
      _id: 1,
      id: 1,
      name: 1,
      role: 1,
      isActive: 1,
      startM: 1,
      endM: 1,
      tecPay: 1,
      isBlocked: 1,
      toolsVerificationPending: 1,
      warehouse: 1
    })
    .populate('role')
    .populate('warehouse', 'name');
  return users;
}

export async function getOperatorsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const operatorRole = await Role.findOne({ id: 'OPE' }).lean();
  const operators = await User.find({
    role: operatorRole._id,
    isActive: true
  }).select({
    _id: 1,
    name: 1,
    isActive: 1
  });
  return operators;
}
export async function getPartnersData(getDetailed) {
  let partners;
  await connectToDatabase();
  const partnerRole = await Role.findOne({ id: 'PARTNER' }).lean();
  if (!getDetailed) {
    partners = await User.find({ role: partnerRole._id, isActive: true })
      .select({
        _id: 1,
        name: 1
      })
      .lean();
  } else {
    partners = await Partner.find()
      .populate([
        {
          path: 'user',
          select: 'name'
        },
        {
          path: 'machines',
          select: 'machineNum'
        }
      ])
      .lean();
  }
  return partners;
}

export async function changeUserStatus({ _id, isActive }) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';
  const currentDate = new Date();
  const result = { reassignedRepairs: 0, reassignedTo: null };
  try {
    const user = await User.findById(_id).populate('role');
    if (!user) {
      error.message = 'No se encontró el usuario especificado.';
      throw error;
    }

    const isTec = user.role?.id === 'TEC';
    const deactivating = isActive === false;

    // Prevent deactivating a technician who still owns a machine range — otherwise
    // their equipment is left uncovered for auto-assignment and reporting. The admin
    // must reassign or free the range first.
    if (deactivating && isTec && (user.startM > 0 || user.endM > 0)) {
      error.message = `No se puede dar de baja al técnico porque tiene asignado el rango de equipos ${user.startM} - ${user.endM}. Reasigne o libere el rango antes de darlo de baja.`;
      throw error;
    }

    await session.startTransaction();

    // When deactivating a technician, hand off any open (PENDIENTE) sale repairs
    // to another active technician so they don't become orphaned (they are filtered
    // by takenBy, so an inactive owner makes them invisible to everyone).
    if (deactivating && isTec) {
      const openRepairsCount = await SaleRepair.countDocuments({
        takenBy: user._id,
        status: 'PENDIENTE'
      }).session(session);
      if (openRepairsCount > 0) {
        const tecRole = await Role.findOne({ id: 'TEC' });
        const replacement = await User.findOne({
          role: tecRole._id,
          isActive: true,
          _id: { $ne: user._id }
        })
          .sort({ createdAt: 1 })
          .session(session);
        if (!replacement) {
          error.message = `El técnico tiene ${openRepairsCount} reparación(es) de venta pendiente(s) y no hay otro técnico activo para recibirlas. Active a otro técnico antes de darlo de baja.`;
          throw error;
        }
        await SaleRepair.updateMany(
          { takenBy: user._id, status: 'PENDIENTE' },
          { $set: { takenBy: replacement._id, updatedAt: currentDate } },
          { session }
        );
        result.reassignedRepairs = openRepairsCount;
        result.reassignedTo = replacement.name;
      }
    }

    user.isActive = isActive;
    await user.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    return result;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al actualizar el estatus del usuario. Intente de nuevo.'
      );
    }
  }
}

export async function unlockUser({ _id, reason, unlockedBy }) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';
  
  try {
    if (!reason || reason.trim().length === 0) {
      error.message = 'Debe proporcionar una razón para desbloquear al usuario.';
      throw error;
    }
    
    if (!unlockedBy) {
      error.message = 'No se especificó quién desbloquea al usuario.';
      throw error;
    }
    
    const user = await User.findById(_id);
    if (!user) {
      error.message = 'No se encontró el usuario especificado.';
      throw error;
    }
    
    if (!user.isBlocked) {
      error.message = 'El usuario no está bloqueado.';
      throw error;
    }
    
    await session.startTransaction();
    
    // Unlock the user
    user.isBlocked = false;
    user.blockReason = '';

    // Clear AUX action timestamps (will be empty for non-AUX users anyway)
    if (user.auxActionTimestamps && user.auxActionTimestamps.length > 0) {
      user.auxActionTimestamps = [];
      console.log('Cleared AUX action timestamps for user:', user.name);
    }
    
    await user.save({ session, isNew: false });
    
    // Create unlock log
    const unlockLog = new UserUnlock({
      user: _id,
      unlockedBy,
      reason: reason.trim(),
      unlockedAt: new Date()
    });
    await unlockLog.save({ session, isNew: true });
    
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
      throw new Error(
        'Ocurrío un error al desbloquear el usuario. Intente de nuevo.'
      );
    }
  }
}

export async function getUserUnlocks() {
  await connectToDatabase();
  // Ensure User model is loaded
  await User.init();
  const unlocks = await UserUnlock.find()
    .populate('user', 'name id')
    .populate('unlockedBy', 'name')
    .sort({ unlockedAt: -1 })
    .lean();
  return unlocks;
}

export async function asignOperatorData({
  type,
  id,
  selectedOperator,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    const operator = await User.findById(selectedOperator);
    if (!operator) {
      error.message = 'El operador indicado no existe.';
      throw error;
    }
    let record;
    switch (type) {
      case 'delivery':
        record = await RentDelivery.findById(id);
        break;
      case 'change':
        record = await RentChange.findById(id);
        break;
      case 'pickup':{
        record = await RentPickup.findById(id);
        const rent = await Rent.findById(record.rent);
        record.machine = rent.machine;
      }
    }
    if (!record) {
      error.message = 'Parámetros incorrectos.';
      throw error;
    }
    record.operator = operator;
    // Cambia el dueño de la vuelta: la programación era del operador anterior.
    record.scheduledTime = null;
    record.takenAt = currentDate;
    record.lastUpdatedBy = lastUpdatedBy;
    record.updatedAt = currentDate;
    await record.save({ isNew: false });
  } catch (e) {
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrío un error al asignar el operador. Intente de nuevo.'
      );
    }
  }
}

// Machine ranges are assigned in fixed, consecutive blocks of this many machines
// (e.g. 1-50, 51-100, 101-150). startM aligns to a block start (n*50 + 1) and endM
// to a block end (n*50).
export const MACHINE_BLOCK_SIZE = 50;

// Highest active machine number, used to derive how many 50-machine blocks exist.
export async function getMaxMachineNum() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const last = await Machine.findOne({ active: true })
    .sort({ machineNum: -1 })
    .select('machineNum')
    .lean();
  return last ? last.machineNum : 0;
}

export async function updateTecnicianData({ id, startM, endM, tecPay }) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';
  try {
    if (!id) {
      error.message = 'Parámetros incorrectos.';
      throw error;
    }
    const tecnicianRole = await Role.findOne({ id: 'TEC' });
    const tecnician = await User.findById(id);
    if (!tecnician) {
      error.message = 'Técnico no encontrado';
      throw error;
    }

    const start = Number(startM);
    const end = Number(endM);
    const isUnassign = start === -1 && end === -1;

    // tecPay is optional; keep the current value when not provided.
    const newTecPay =
      tecPay === undefined || tecPay === null
        ? tecnician.tecPay
        : Number(tecPay);
    if (Number.isNaN(newTecPay) || newTecPay < 0) {
      error.message = 'El pago por mantenimiento debe ser un número válido.';
      throw error;
    }

    await session.startTransaction();

    // "Liberar rango": leave the technician without machines. In-flight
    // maintenances stay with whoever holds them until reassigned to another tech.
    if (isUnassign) {
      tecnician.startM = -1;
      tecnician.endM = -1;
      tecnician.tecPay = newTecPay;
      await tecnician.save({ session, new: false });
      await session.commitTransaction();
      await session.endSession();
      return;
    }

    // Validate the range is a set of consecutive 50-machine blocks.
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start ||
      start % MACHINE_BLOCK_SIZE !== 1 ||
      end % MACHINE_BLOCK_SIZE !== 0
    ) {
      error.message = `El rango debe estar en bloques de ${MACHINE_BLOCK_SIZE} equipos consecutivos.`;
      throw error;
    }

    // Adjust any other ACTIVE technician whose range overlaps the requested one so
    // that no machine is owned by two technicians. A single contiguous range can
    // only be trimmed at an edge or fully absorbed — a middle takeover would split
    // it in two, which the range model can't represent, so we reject it.
    const overlappingTechs = await User.find({
      _id: { $ne: tecnician._id },
      role: tecnicianRole._id,
      isActive: true,
      startM: { $gt: 0, $lte: end },
      endM: { $gte: start }
    }).session(session);

    for (const other of overlappingTechs) {
      const keepsLeft = start > other.startM; // other keeps [other.startM, start-1]
      const keepsRight = end < other.endM; // other keeps [end+1, other.endM]
      if (keepsLeft && keepsRight) {
        error.message = `El rango solicitado partiría en dos el rango del técnico ${other.name} (${other.startM} - ${other.endM}). Ajuste la selección.`;
        throw error;
      }
      if (keepsLeft) {
        other.endM = start - 1;
      } else if (keepsRight) {
        other.startM = end + 1;
      } else {
        other.startM = -1;
        other.endM = -1;
      }
      await other.save({ session, new: false });
    }

    tecnician.startM = start;
    tecnician.endM = end;
    tecnician.tecPay = newTecPay;
    await tecnician.save({ session, new: false });

    // Invariant: in-flight maintenances (PENDIENTE / EN_PROGRESO) for machines in
    // this technician's range belong to this technician. This moves in-flight work
    // taken over from other techs (or previously unassigned) to the receiver, while
    // finished maintenances stay with whoever completed them (payroll correctness).
    const machinesInRange = await Machine.find({
      machineNum: { $gte: start, $lte: end }
    })
      .select('_id')
      .session(session);
    const machineIdsInRange = machinesInRange.map((m) => m._id);
    if (machineIdsInRange.length > 0) {
      await Mantainance.updateMany(
        {
          machine: { $in: machineIdsInRange },
          status: { $in: ['PENDIENTE', 'EN_PROGRESO'] },
          takenBy: { $ne: tecnician._id }
        },
        { $set: { takenBy: tecnician._id } },
        { session }
      );
    }

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
      throw new Error(
        'Ocurrío un error al actualizar el técnico. Intente de nuevo.'
      );
    }
  }
}

/**
 * Check if an operator should be blocked based on time between completed tasks
 * This should be called BEFORE saving the current task completion
 * @param {string} operatorId - The operator's user ID
 * @param {Date} currentFinishedAt - The current task's completion time (not yet saved)
 * @param {Object} session - Mongoose session for transactions
 * @returns {Promise<boolean>} - Returns true if user was blocked, false otherwise
 */
export async function checkAndBlockOperator(operatorId, currentFinishedAt, session) {
  try {
    console.log('=== checkAndBlockOperator START ===');
    console.log('Operator ID:', operatorId);
    console.log('Current Finished At:', currentFinishedAt);
    
    // Get the operator and check if they have the operator role
    const operatorRole = await Role.findOne({ id: 'OPE' });
    const operator = await User.findById(operatorId).populate('role');
    
    if (!operator || operator.role._id.toString() !== operatorRole._id.toString()) {
      console.log('Not an operator, skipping blocking logic');
      return false;
    }

    console.log('Operator found:', operator.name);

    // Get start and end of current day
    const startOfDay = setDateToInitial(currentFinishedAt);
    const endOfDay = setDateToEnd(currentFinishedAt);
    console.log('Day range:', { startOfDay, endOfDay });

    // Check if the operator was unlocked today and get the latest unlock time
    const lastUnlock = await UserUnlock.findOne({
      user: operatorId,
      unlockedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ unlockedAt: -1 }).lean();

    let taskStartTime = startOfDay;
    if (lastUnlock) {
      taskStartTime = lastUnlock.unlockedAt;
      console.log('Operator was unlocked today at:', taskStartTime);
      console.log('Only considering tasks completed after unlock time');
    }

    // Find all completed tasks for this operator after the unlock time (or start of day)
    const [deliveries, pickups, changes, extraTrips, saleDeliveries] = await Promise.all([
      RentDelivery.find({
        operator: operatorId,
        status: 'ENTREGADA',
        finishedAt: { $gte: taskStartTime, $lte: endOfDay }
      }).sort({ finishedAt: 1 }).lean(),
      
      RentPickup.find({
        operator: operatorId,
        status: 'RECOLECTADA',
        finishedAt: { $gte: taskStartTime, $lte: endOfDay }
      }).sort({ finishedAt: 1 }).lean(),
      
      RentChange.find({
        operator: operatorId,
        status: 'FINALIZADO',
        finishedAt: { $gte: taskStartTime, $lte: endOfDay }
      }).sort({ finishedAt: 1 }).lean(),

      ExtraTrip.find({
        assignedTo: operatorId,
        status: 'COMPLETADA',
        completedAt: { $gte: taskStartTime, $lte: endOfDay }
      })
        .select('completedAt')
        .sort({ completedAt: 1 })
        .lean(),

      SaleDelivery.find({
        assignedTo: operatorId,
        type: 'ENTREGA',
        status: 'COMPLETADA',
        completedAt: { $gte: taskStartTime, $lte: endOfDay }
      })
        .select('completedAt')
        .sort({ completedAt: 1 })
        .lean()
    ]);

    console.log('Tasks found - Deliveries:', deliveries.length, 'Pickups:', pickups.length, 'Changes:', changes.length, 'ExtraTrips:', extraTrips.length, 'SaleDeliveries:', saleDeliveries.length);

    // Combine all tasks and sort by finishedAt ascending (oldest to newest)
    const normalizedExtraTrips = extraTrips.map((trip) => ({ finishedAt: trip.completedAt }));
    const normalizedSaleDeliveries = saleDeliveries.map((d) => ({ finishedAt: d.completedAt }));
    const allCompletedTasks = [...deliveries, ...pickups, ...changes, ...normalizedExtraTrips, ...normalizedSaleDeliveries]
      .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime());

    console.log('Total completed tasks (before adding current):', allCompletedTasks.length);

    // Add the current task (not yet saved) to the list
    allCompletedTasks.push({ finishedAt: currentFinishedAt });

    console.log('Total tasks including current:', allCompletedTasks.length);

    // If there's only one task (the current one), don't block
    if (allCompletedTasks.length <= 1) {
      console.log('Only one task since unlock/start of day, not blocking');
      return false;
    }

    // Calculate average time between consecutive tasks (including the current one)
    let totalTimeDiff = 0;
    const timeDiffs = [];
    for (let i = 1; i < allCompletedTasks.length; i++) {
      const timeDiffMs = new Date(allCompletedTasks[i].finishedAt).getTime() - 
                         new Date(allCompletedTasks[i - 1].finishedAt).getTime();
      const timeDiffMin = timeDiffMs / (1000 * 60);
      timeDiffs.push(timeDiffMin.toFixed(2));
      totalTimeDiff += timeDiffMs;
    }

    console.log('Time differences between tasks (minutes):', timeDiffs);

    const averageTimeDiffMs = totalTimeDiff / (allCompletedTasks.length - 1);
    const averageTimeDiffMinutes = averageTimeDiffMs / (1000 * 60);

    console.log('Average time between tasks:', averageTimeDiffMinutes.toFixed(2), 'minutes');

    // If average time between tasks exceeds 45 minutes, block the operator
    if (averageTimeDiffMinutes > 45) {
      console.log('⚠️ BLOCKING OPERATOR - Average exceeds 45 minutes');
      operator.isBlocked = true;
      await operator.save({ session, new: false });
      console.log('=== checkAndBlockOperator END - USER BLOCKED ===');
      return true;
    }

    console.log('✅ Not blocking - Average is within limit');
    console.log('=== checkAndBlockOperator END ===');
    return false;
  } catch (error) {
    console.error('Error in checkAndBlockOperator:', error);
    return false;
  }
}

/**
 * Record an AUX action timestamp and check if the user should be blocked
 * This handles both recording the action and checking blocking conditions
 * Caller should verify user role before calling this function
 * @param {string} auxUserId - The AUX user's ID
 * @param {Object} session - Mongoose session for transactions (optional)
 * @returns {Promise<boolean>} - Returns true if user was blocked, false otherwise
 */
export async function recordAuxActionAndCheckBlocking(auxUserId, session = null) {
  console.log('=== recordAuxActionAndCheckBlocking START ===');
  console.log('AUX User ID:', auxUserId);

  try {
    if (!isConnected()) {
      await connectToDatabase();
    }

    const currentActionTime = new Date();
    
    // Get the AUX user
    const auxUser = await User.findById(auxUserId);
    
    if (!auxUser) {
      console.log('User not found, skipping action recording');
      return false;
    }

    console.log('AUX User found:', auxUser.name);

    // Get start of current day to clean old timestamps
    const startOfDay = setDateToInitial(currentActionTime);

    // Clean timestamps from previous days
    auxUser.auxActionTimestamps = auxUser.auxActionTimestamps.filter(
      timestamp => new Date(timestamp) >= startOfDay
    );

    // Add current action timestamp
    auxUser.auxActionTimestamps.push(currentActionTime);
    console.log('Action recorded. Total actions today:', auxUser.auxActionTimestamps.length);

    // Check if the user was unlocked today and get the latest unlock time
    const endOfDay = setDateToEnd(currentActionTime);
    const lastUnlock = await UserUnlock.findOne({
      user: auxUserId,
      unlockedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ unlockedAt: -1 }).lean();

    let actionStartTime = startOfDay;
    if (lastUnlock) {
      actionStartTime = lastUnlock.unlockedAt;
      console.log('AUX user was unlocked today at:', actionStartTime);
      console.log('Only considering actions after unlock time');
    }

    // Filter timestamps to only include actions after unlock time (or start of day)
    const todayActions = auxUser.auxActionTimestamps
      .filter(timestamp => {
        const ts = new Date(timestamp);
        return ts >= actionStartTime && ts <= endOfDay;
      })
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    console.log('Total actions found for today (after unlock):', todayActions.length);

    // Need at least 2 actions to calculate average
    if (todayActions.length < 2) {
      console.log('Less than 2 actions, not blocking');
      // Save the updated timestamps before returning
      if (session) {
        await auxUser.save({ session, new: false });
      } else {
        await auxUser.save({ new: false });
      }
      console.log('=== recordAuxActionAndCheckBlocking END ===');
      return false;
    }

    // Calculate average time between consecutive actions
    let totalTimeDiff = 0;
    const timeDiffs = [];
    for (let i = 1; i < todayActions.length; i++) {
      const timeDiffMs = new Date(todayActions[i]).getTime() - 
                         new Date(todayActions[i - 1]).getTime();
      const timeDiffMin = timeDiffMs / (1000 * 60);
      timeDiffs.push(timeDiffMin.toFixed(2));
      totalTimeDiff += timeDiffMs;
    }

    console.log('Time differences between actions (minutes):', timeDiffs);

    const averageTimeDiffMs = totalTimeDiff / (todayActions.length - 1);
    const averageTimeDiffMinutes = averageTimeDiffMs / (1000 * 60);

    console.log('Average time between actions:', averageTimeDiffMinutes.toFixed(2), 'minutes');

    // If average time between actions exceeds 25 minutes, block the user
    if (averageTimeDiffMinutes > 25) {
      console.log('⚠️ BLOCKING AUX USER - Average exceeds 25 minutes');
      auxUser.isBlocked = true;
    }

    // Save the user (with updated timestamps and possibly blocked status)
    if (session) {
      await auxUser.save({ session, new: false });
    } else {
      await auxUser.save({ new: false });
    }

    const wasBlocked = auxUser.isBlocked && averageTimeDiffMinutes > 25;
    if (wasBlocked) {
      console.log('=== recordAuxActionAndCheckBlocking END - USER BLOCKED ===');
    } else {
      console.log('✅ Not blocking - Average is within limit');
      console.log('=== recordAuxActionAndCheckBlocking END ===');
    }
    
    return wasBlocked;
  } catch (error) {
    console.error('Error in recordAuxActionAndCheckBlocking:', error);
    return false;
  }
}


