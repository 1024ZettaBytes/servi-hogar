import { connectToDatabase, isConnected } from '../db';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { RentDelivery } from '../models/RentDelivery';
import { RentChange } from '../models/RentChange';
import { RentPickup } from '../models/RentPickup';
import { Vehicle } from '../models/Vehicle';
import { City } from '../models/City';
import { Partner } from '../models/Partner';
import { Mantainance } from '../models/Mantainance';
import { UserUnlock } from '../models/UserUnlock';
import { setDateToEnd, setDateToInitial } from '../client/utils';
import { Rent } from '../models/Rent';

User.init();
export async function saveUserData({ id, password, name, role }) {
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
      res.status(422).json({ ok: false, message: `El rol ${role} no existe` });
      return;
    }
    const newUser = new User({ id, name, role: givenRole._id });
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
export async function getUsersData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const users = await User.find()
    .select({
      _id: 1,
      id: 1,
      name: 1,
      role: 1,
      isActive: 1,
      startM: 1,
      endM: 1,
      isBlocked: 1
    })
    .populate('role');
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
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  const user = await User.findById(_id);
  if (!user) {
    error.message = 'No se encontró el usuario especificado.';
    throw error;
  }
  user.isActive = isActive;
  await user.save({ isNew: false });
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

export async function updateTecnicianData({ id, startM, endM }) {
  const conn = await connectToDatabase();
  const session = await conn.startSession();
  let error = new Error();
  error.name = 'Internal';
  try {
    if (!id || !startM || !endM) {
      error.message = 'Parámetros incorrectos.';
      throw error;
    }
    const tecnicianRole = await Role.findOne({ id: 'TEC' });

    const tecnician = await User.findById(id);
    if (!tecnician) {
      throw new Error('Técnico no encontrado');
    }
    // find user with startM and endM
    const existingTecnician = await User.findOne({
      role: tecnicianRole._id,
      startM,
      endM
    });
    if (existingTecnician) {
      const existingMantenances = await Mantainance.find({
        status: 'PENDIENTE',
        takenBy: existingTecnician._id
      });
      for (const m of existingMantenances) {
        m.takenBy = tecnician._id;
        await m.save({ session, new: false });
      }

      existingTecnician.startM = -1;
      existingTecnician.endM = -1;
      await existingTecnician.save({ session, new: false });
    }
    tecnician.startM = startM;
    tecnician.endM = endM;
    await tecnician.save({ session, new: false });
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
    const [deliveries, pickups, changes] = await Promise.all([
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
      }).sort({ finishedAt: 1 }).lean()
    ]);

    console.log('Tasks found - Deliveries:', deliveries.length, 'Pickups:', pickups.length, 'Changes:', changes.length);

    // Combine all tasks and sort by finishedAt ascending (oldest to newest)
    const allCompletedTasks = [...deliveries, ...pickups, ...changes]
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

    // If average time between tasks exceeds 35 minutes, block the operator
    if (averageTimeDiffMinutes > 35) {
      console.log('⚠️ BLOCKING OPERATOR - Average exceeds 35 minutes');
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


