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
      endM: 1
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
      case 'pickup':
        record = await RentPickup.findById(id);
    }
    if (!record) {
      error.message = 'Parámetros incorrectos.';
      throw error;
    }
    record.operator = operator;
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
