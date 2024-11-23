'use strict';
import { connectToDatabase, isConnected } from '../db';
import { CustomerMovement } from 'lib/models/CustomerMovement';
import { Customer } from '../models/Customer';
import { RentChange } from '../models/RentChange';
import { CustomerLevel } from '../models/CustomerLevel';
import { City } from '../models/City';
import { Residence } from '../models/Residence';
import { Sector } from '../models/Sector';
import { Role } from '../models/Role';
import { Rent } from '../models/Rent';
import { Machine } from '../models/Machine';
import { validateMapsUrl, getCoordinatesFromUrl } from '../client/utils';
import mongoose from 'mongoose';
import { HOW_FOUND_LIST } from '../consts/OBJ_CONTS';
import { RentDelivery } from 'lib/models/RentDelivery';
Machine.init();
CustomerMovement.init();
Sector.init();
Role.init();
Rent.init();
export async function updateResidenceDataFunc(
  session,
  residence,
  error,
  mapsRequired = true
) {
  let {
    _id,
    street,
    suburb,
    city,
    sector,
    residenceRef,
    nameRef,
    telRef,
    maps
  } = residence;
  const currentDate = Date.now();
  let residenceFromDb = await Residence.findById(_id);
  if (!residenceFromDb) {
    error.message =
      'Error al actualizar el domicilio, por favor intente de nuevo';
    throw error;
  }
  if (mapsRequired || maps !== '') {
    if (!maps || !validateMapsUrl(maps)) {
      error.message =
        'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
      throw error;
    }

    const coordinates = getCoordinatesFromUrl(maps);
    if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
      error.message =
        'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
      throw error;
    }
    residenceFromDb.maps = maps;
    residenceFromDb.coordinates = coordinates;
  }
  if (!mapsRequired && maps === '') {
    residenceFromDb.maps = maps;
    residenceFromDb.coordinates = null;
  }
  const cityFromDb = await City.findById(city?._id);
  if (!cityFromDb) {
    error.message = 'Ciudad no válida';
    throw error;
  }
  const sectorFromDb = cityFromDb.sectors.filter((s) => {
    return s._id.toString() === sector?._id;
  });
  if (!sectorFromDb || sectorFromDb.length === 0) {
    error.message = 'Sector no válido';
    throw error;
  }

  residenceFromDb.street = street;
  residenceFromDb.suburb = suburb;
  residenceFromDb.city = city;
  residenceFromDb.sector = sector;
  residenceFromDb.residenceRef = residenceRef;
  residenceFromDb.nameRef = nameRef;
  residenceFromDb.telRef = telRef;
  residenceFromDb.updatedAt = currentDate;
  await residenceFromDb.save({ session, new: false });
}

function removeReferralCustomer(referredBy, referralId) {
  const referrals = referredBy?.referrals.filter(
    (ref) => ref.toString() !== referralId.toString()
  );
  referredBy.referrals = referrals;
  return referredBy;
}
export async function getCustomersData(forRent = false, noDetails = false) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const params = forRent ? { active: true, hasRent: false } : { active: true };
  const populateSectors = forRent
    ? {
        path: 'city',
        select: '_id id name',
        model: 'cities',
        populate: {
          path: 'sectors',
          select: '_id name',
          model: 'sectors'
        }
      }
    : { path: 'city', select: '_id id name sectors', model: 'cities' };
  const costumers = noDetails
    ? await Customer.find()
        .select({
          name: 1,
          cell: 1
        })
        .lean()
    : await Customer.find(params)
        .sort({ createdAt: -1 })
        .select({
          level: 1,
          currentResidence: 1,
          comments: 1,
          name: 1,
          cell: 1,
          balance: 1,
          freeWeeks: 1
        })
        .populate([
          {
            path: 'level',
            select: 'id name'
          },
          {
            path: 'currentResidence',
            select:
              'city sector street suburb maps telRef street residenceRef nameRef',
            populate: [
              populateSectors,
              {
                path: 'sector',
                select: '_id name',
                model: 'sectors'
              }
            ]
          }
        ])
        .lean();
  return costumers;
}

export async function getCustomerByIdData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let customer;

  try {
    //await CustomerMovement.updateMany({}, { machine: null });
    /*const rentsToFix = await Rent.find({num:{$gte:1}}).sort({ num: -1 });
    for (let n = 0; n < rentsToFix.length; n++) {
      const rentToFix = rentsToFix[n];
      console.log(rentToFix.num)
      const rentChanges = await RentChange.find({
        rent: rentToFix,
        status: "FINALIZADO",
      }).sort({ finishedAt: 1 });
      if (rentChanges.length > 0) {
        // Fix movements for first machine on rent
        let change = rentChanges[0];
        let firstMovements = await CustomerMovement.find({
          rent: rentToFix,
          date: { $lte: change.finishedAt },
        });
        console.log("First",firstMovements.length)
        console.log(change.pickedMachine)
        for (let i = 0; i < firstMovements.length; i++) {
          firstMovements[i].machine = change.pickedMachine;
          await firstMovements[i].save({isNew:false});
        }

        // Fix movements for next machines on rent except for the last one

        for (let i = 1; i < rentChanges.length - 1; i++) {
          const start = rentChanges[i].finishedAt;
          const end = rentChanges[i + 1].finishedAt;
          const change_i = rentChanges[i];
          let movsOnRange = await CustomerMovement.find({
            rent: rentToFix,
            date: { $gte: start, $lte: end },
          });
          console.log(change.leftMachine)
          for (let x = 0; x < movsOnRange.length; x++) {
            movsOnRange[x].machine = change.leftMachine;
            await movsOnRange[x].save({isNew:false});
          }
        }
        if (rentChanges.length > 1) {
          change = rentChanges[rentChanges.length - 1];
          let lastMovements = await CustomerMovement.find({
            rent: rentToFix,
            date: { $gte: change.finishedAt },
          });
          
          console.log("Last: ",lastMovements.length)
          console.log(change.leftMachine)
          
          for (let i = 0; i < lastMovements.length; i++) {
            lastMovements[i].machine = change.leftMachine;
            await lastMovements[i].save({isNew:false});
          }
        }
        // Fix movements for last machine on rent

        ///.populate("rent").sort({date: -1})
        //.exec();
      } else {
        let allmovs = await CustomerMovement.find({
          rent: rentToFix,
        });
        for (let i = 0; i < allmovs.length; i++) {
          allmovs[i].machine = rentToFix.machine;
          await allmovs[i].save();
        }
      }
    }
    console.log("Gonna get customer detail");
    */
    customer = await Customer.findById(id)
      .populate([
        'level',
        {
          path: 'currentResidence',
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
        },
        {
          path: 'movements',
          populate: ['rent', 'machine']
        },
        'currentRent',
        'referredBy',
        'referrals',
        'lastUpdatedBy'
      ])
      .lean();
    customer
      ? (customer.lastUpdatedBy = {
          _id: customer?.lastUpdatedBy?._id,
          name: customer?.lastUpdatedBy?.name
        })
      : null;
    // Get longer rent time
    let longerRentTime = 0;
    if (customer.totalRentWeeks > 0) {
      const longerRent = await Rent.findOne({ customer }).sort({});
      longerRentTime = longerRent ? longerRent.totalWeeks : 0;
    }
    customer.longestWeeks = longerRentTime;
    let rentToFind = customer.currentRent;
    if (!rentToFind) {
      rentToFind = await Rent.findOne({ customer: customer._id }).sort({
        startDate: -1
      });
    }
    customer.residenceImages = rentToFind ? rentToFind.imagesUrl : null;
  } catch (e) {
    console.error('\x1b[31m', 'Error while retrieving customer by id: ', id);
    console.error(e.message);
    return false;
  }
  return customer;
}

export async function getCustomersLevelsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const costumersLevels = await CustomerLevel.find({});
  return costumersLevels;
}

export async function saveCustomerData({
  name,
  cell,
  email,
  howFound,
  referredBy,
  street,
  suburb,
  city,
  sector,
  residenceRef,
  nameRef,
  telRef,
  maps,
  level,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  let referredByCustomer;
  const currentDate = Date.now();
  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    if (!HOW_FOUND_LIST[howFound]) {
      error.message = 'Indique una fuente válida';
      throw error;
    }
    let coordinates = null;
    let newMaps = null;
    if (maps && maps !== '') {
      if (!validateMapsUrl(maps)) {
        error.message =
          'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
        throw error;
      }
      coordinates = getCoordinatesFromUrl(maps);
      if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
        error.message =
          'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
        throw error;
      }
      newMaps = maps;
    }
    const cityFromDb = await City.findById(city);
    if (!cityFromDb) {
      error.message = 'Ciudad no válida';
      throw error;
    }
    const sectorFromDb = cityFromDb.sectors.filter((s) => {
      return s._id.toString() === sector;
    });
    if (!sectorFromDb || sectorFromDb.length === 0) {
      error.message = 'Sector no válido';
      throw error;
    }
    const existingCustomer = await Customer.findOne({ cell });
    if (existingCustomer) {
      error.message = 'Ya existe un cliente con el telefono ingresado';
      throw error;
    }
    // generate residence
    const residence = await new Residence({
      street,
      suburb,
      city,
      sector: sectorFromDb[0],
      residenceRef,
      nameRef,
      telRef,
      maps: newMaps,
      coordinates,
      createdAt: currentDate,
      updatedAt: currentDate
    }).save({ session, new: true });
    if (!residence) {
      error.message = 'Error al guardar cliente. Por favor intente de nuevo.';
      throw error;
    }
    let newCustomerData = {
      name,
      cell,
      email,
      residences: [residence],
      currentResidence: residence,
      howFound,
      level,
      createdAt: currentDate,
      updatedAt: currentDate,
      lastUpdatedBy
    };
    if (howFound === 'referred') {
      referredByCustomer = await Customer.findById(referredBy?.id);
      if (!referredByCustomer) {
        error.message = 'El cliente que hizo la recomendación no existe';
        throw error;
      }
      newCustomerData.wasReferred = true;
      newCustomerData.referredBy = referredByCustomer._id;
    }
    // set residence to new customer
    const newCustomer = await new Customer({ ...newCustomerData }).save({
      session,
      new: true
    });
    if (referredByCustomer) {
      referredByCustomer.referrals.push(newCustomer._id);
      referredByCustomer.updatedAt = currentDate;
      referredByCustomer.lastUpdatedBy = lastUpdatedBy;
      await referredByCustomer.save({ session, new: false });
    }
    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrío un error al guardar el cliente. Intente de nuevo.'
      );
    }
  }
}

export async function updateCustomerData(
  {
    _id,
    name,
    cell,
    email,
    howFound,
    referredBy,
    currentResidence,
    level,
    comments,
    info,
    residence,
    lastUpdatedBy
  },
  userRole
) {
  let error = new Error();
  error.name = 'Internal';
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!isConnected()) {
      await connectToDatabase();
    }

    // When the user is updating personal info
    if (info) {
      const existingCustomer = await Customer.findOne({
        cell
      });
      if (existingCustomer && _id !== existingCustomer._id.toString()) {
        error.message = 'Ya existe un cliente con el telefono ingresado';
        throw error;
      }
      let currentCustomer = await Customer.findById(_id);
      const existingLevel = await CustomerLevel.findById(level?._id);
      if (!existingLevel) {
        error.message = 'El nivel indicado no existe';
        throw error;
      }
      if (!HOW_FOUND_LIST[howFound]) {
        error.message = 'Indique una fuente válida';
        throw error;
      }
      let referredByCustomer;
      // new state is referred
      if (howFound === 'referred') {
        referredByCustomer = await Customer.findById(referredBy?._id);
        if (!referredByCustomer) {
          error.message = 'El cliente que hizo la recomendación no existe';
          throw error;
        }
        referredByCustomer.referrals.push(_id);
        referredByCustomer.updatedAt = currentDate;
        referredByCustomer.lastUpdatedBy = lastUpdatedBy;
        // wasnt referred
        if (currentCustomer.howFound !== 'referred') {
          await referredByCustomer.save({ session, new: false });
        } else {
          let previousReferredBy = await Customer.findById(
            currentCustomer.referredBy
          );
          //was previously referred and its different
          if (
            referredByCustomer._id.toString() !==
            previousReferredBy._id.toString()
          ) {
            previousReferredBy = removeReferralCustomer(
              previousReferredBy,
              currentCustomer?._id
            );
            previousReferredBy.updatedAt = currentDate;
            previousReferredBy.lastUpdatedBy = lastUpdatedBy;
            await previousReferredBy.save({ session, new: false });
            await referredByCustomer.save({ session, new: false });
          }
        }
        currentCustomer.wasReferred = true;
        currentCustomer.referredBy = referredByCustomer._id;
      } else {
        // if customer was previously referred but no more
        if (currentCustomer.howFound === 'referred') {
          let previousReferredBy = await Customer.findById(
            currentCustomer?.referredBy?._id
          );
          previousReferredBy = removeReferralCustomer(
            previousReferredBy,
            currentCustomer?._id
          );
          previousReferredBy.updatedAt = currentDate;
          previousReferredBy.lastUpdatedBy = lastUpdatedBy;
          await previousReferredBy.save({ session, new: false });
          currentCustomer.wasReferred = false;
          currentCustomer.referredBy = null;
        }
      }
      currentCustomer.name = name;
      currentCustomer.cell = cell;
      currentCustomer.comments = comments;
      if (userRole === 'ADMIN') currentCustomer.level = existingLevel;
      currentCustomer.howFound = howFound;
      currentCustomer.email = email;
      currentCustomer.updatedAt = currentDate;
      currentCustomer.lastUpdatedBy = lastUpdatedBy;
      await currentCustomer.save({ session, new: false });
    }
    // When the user is updating residence info
    if (residence) {
      let {
        street,
        suburb,
        city,
        sector,
        residenceRef,
        nameRef,
        telRef,
        maps
      } = currentResidence;
      let coordinates = null;
      if (maps && maps !== '') {
        if (!validateMapsUrl(currentResidence?.maps)) {
          error.message =
            'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
          throw error;
        }
        coordinates = getCoordinatesFromUrl(maps);
        if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
          error.message =
            'Por favor ingrese una url de maps válida (Ej: https://www.google.com/maps/place/...)';
          throw error;
        }
      }
      const cityFromDb = await City.findById(city?._id);
      if (!cityFromDb) {
        throw new Error('Ciudad no válida');
      }
      const sectorFromDb = cityFromDb.sectors.filter((s) => {
        return s._id.toString() === sector?._id;
      });
      if (!sectorFromDb || sectorFromDb.length === 0) {
        throw new Error('Sector no válido');
      }
      let residenceFromDb = await Residence.findById(currentResidence?._id);
      if (!residenceFromDb) {
        error.message =
          'Error al actualizar el domicilio, por favor intente de nuevo';
        throw error;
      }
      residenceFromDb.street = street;
      residenceFromDb.suburb = suburb;
      residenceFromDb.city = city;
      residenceFromDb.sector = sector;
      residenceFromDb.residenceRef = residenceRef;
      residenceFromDb.nameRef = nameRef;
      residenceFromDb.telRef = telRef;
      residenceFromDb.updatedAt = currentDate;
      residenceFromDb.maps = maps;
      residenceFromDb.coordinates = coordinates;
      await residenceFromDb.save({ session, new: false });
      let customer = await Customer.findById(_id);
      customer.updatedAt = currentDate;
      customer.lastUpdatedBy = lastUpdatedBy;
      await customer.save({ session, new: false });
    }
    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    console.log(e.message);
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error(
        'Ocurrió un error al actualizar el cliente. Intente de nuevo.'
      );
  }
}

export async function updateCustomerResidenceData(
  { _id, cell, currentResidence, lastUpdatedBy },
  userRole
) {
  let error = new Error();
  error.name = 'Internal';
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const currentDate = Date.now();
    if (!isConnected()) {
      await connectToDatabase();
    }

    const existingCustomer = await Customer.findOne({
      cell
    });
    if (existingCustomer && _id !== existingCustomer._id.toString()) {
      error.message = 'Ya existe un cliente con el telefono ingresado';
      throw error;
    }
    await updateResidenceDataFunc(session, currentResidence, error, false);
    let currentCustomer = await Customer.findById(_id);
    let customer = await Customer.findById(_id);
    customer.cell = cell;
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    await customer.save({ session, new: false });
    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    console.log(e.message);
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error(
        'Ocurrió un error al actualizar el domicilio. Intente de nuevo.'
      );
  }
}

export async function deleteCustomersData({ arrayOfIds, lastUpdatedBy }) {
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
      let customerToDelete = await Customer.findById(arrayOfIds[i]);
      if (!customerToDelete) {
        throw new Error('Uno o más clientes no existen.');
      }
      customerToDelete.active = false;
      customerToDelete.updatedAt = currentDate;
      customerToDelete.lastUpdatedBy = lastUpdatedBy;
      await customerToDelete.save({ session, new: false });
    }
    await session.commitTransaction();
    await session.endSession();
    return true;
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else
      throw new Error(
        'Ocurrió un error al eliminar cliente. Intente de nuevo.'
      );
  }
}
