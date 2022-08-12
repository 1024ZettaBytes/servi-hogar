import { connectToDatabase, isConnected } from "../db";
import { Customer } from "../models/Customer";
import { CustomerLevel } from "../models/CustomerLevel";
import { City } from "../models/City";
import { Residence } from "../models/Residence";
import { User } from "lib/models/User";
import { Sector } from "../models/Sector";
Sector.init();
export async function getCustomersData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const costumers = await Customer.find({})
    .populate([
      "level",
      {
        path: "currentResidence",
        populate: [
          {
            path: "city",
            model: "cities",
          },
          {
            path: "sector",
            model: "sectors",
          },
        ],
      },
    ])
    .exec();

  return costumers;
}

export async function getCustomerByIdData(id) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const costumer = await Customer.findById(id)
    .populate([
      "level",
      {
        path: "currentResidence",
        populate: [
          {
            path: "city",
            model: "cities",
          },
          {
            path: "sector",
            model: "sectors",
          },
        ],
      },
      "referredBy",
      "referrals",
    ])
    .exec();

  return costumer;
}

export async function getCustomersLevelsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const costumersLevels = await CustomerLevel.find({});

  return costumersLevels;
}

export async function saveCustomerData({
  curp,
  name,
  cell,
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
}) {
  let referredByCustomer;
  if (!isConnected()) {
    await connectToDatabase();
  }
  const cityFromDb = await City.findById(city);
  if (!cityFromDb) {
    throw new Error("Ciudad no válida");
  }
  const sectorFromDb = cityFromDb.sectors.filter((s) => {
    return s._id.toString() === sector;
  });
  if (!sectorFromDb || sectorFromDb.length === 0) {
    throw new Error("Sector no válido");
  }
  const existingCustomer = await Customer.findOne({ curp });
  if (existingCustomer) {
    throw new Error("Ya existe un cliente con la CURP ingresada");
  }
  // generate residence
  const currentDate = Date.now();
  const residence = await new Residence({
    street,
    suburb,
    city,
    sector: sectorFromDb[0],
    residenceRef,
    nameRef,
    telRef,
    maps,
    createdAt: currentDate,
    updatedAt: currentDate,
  }).save();
  if (!residence) {
    throw new Error("Error al guardar cliente. Por favor intente de nuevo.");
  }
  let newCustomerData = {
    curp,
    name,
    cell,
    residences: [residence],
    currentResidence: residence,
    howFound,
    level,
    createdAt: currentDate,
    updatedAt: currentDate,
  };
  if (howFound === "referred") {
    referredByCustomer = await Customer.findById(referredBy?.id);
    if (!referredByCustomer) {
      throw new Error("El cliente que hizo la recomendación no existe");
    }
    newCustomerData.wasReferred = true;
    newCustomerData.referredBy = referredByCustomer._id;
  }
  // set residence to new customer
  const newCustomer = await new Customer({ ...newCustomerData }).save();
  if (referredByCustomer) {
    referredByCustomer.referrals.push(newCustomer._id);
    referredByCustomer.freeWeeks = referredByCustomer.freeWeeks + 1;
    await referredByCustomer.save();
  }
  return true;
}

export async function updateCustomerData({
  _id,
  curp,
  name,
  cell,
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
  info,
}) {
  const currentDate = Date.now();
  if (!isConnected()) {
    await connectToDatabase();
  }
  // When the user is updating only personal info
  if (info) {
    const existingCustomer = await Customer.findOne({
      curp: curp.toUpperCase(),
    });
    if (existingCustomer &&_id !== existingCustomer._id.toString() ) {
      throw new Error("Ya existe un cliente con la CURP ingresada");
    }
    let currentCustomer = await Customer.findById(_id);
    const existingLevel = await CustomerLevel.findById(level?._id);
    if (!existingLevel) {
      throw new Error("El nivel indicado no existe");
    }
    let referredByCustomer;
    // new state is referred
    if (howFound === "referred") {
      referredByCustomer = await Customer.findById(referredBy?._id);
      if (!referredByCustomer) {
        throw new Error("El cliente que hizo la recomendación no existe");
      }
      // and wasnt previously referred
      if (currentCustomer.howFound !== "referred") {
        referredByCustomer.freeWeeks = referredByCustomer.freeWeeks + 1;
        referredByCustomer.referrals.push(_id);
      }
      currentCustomer.wasReferred = true;
      currentCustomer.referredBy = referredByCustomer._id;
      await referredByCustomer.save();
    } else {
      // if customer was previously referred but no more
      if (currentCustomer.howFound === "referred") {
        currentCustomer.wasReferred = false;
        currentCustomer.referredBy = null;
        referredByCustomer = await Customer.findById(referredBy?._id);
        const referrals = referredByCustomer?.referrals.filter(
          (ref) => ref.toString() !== _id
        );
        referredByCustomer.referrals = referrals;
        referredByCustomer.freeWeeks =
          referredByCustomer.freeWeeks > 0
            ? referredByCustomer.freeWeeks - 1
            : 0;
        referredByCustomer.updatedAt = currentDate;
        await referredByCustomer.save();
      }
    }
    currentCustomer.curp = curp;
    currentCustomer.name = name;
    currentCustomer.cell = cell;
    currentCustomer.level = existingLevel;
    currentCustomer.howFound = howFound;
    currentCustomer.updatedAt = currentDate;
    await currentCustomer.save();
    return true;
  }
}
