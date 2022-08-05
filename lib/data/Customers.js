import { connectToDatabase, isConnected } from "../db";
import { Customer } from "../models/Customer";
import { CustomerLevel } from "../models/CustomerLevel";
import { City } from "../models/City";
import { Residence } from "../models/Residence";
export async function getCustomersData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const costumers = await Customer.find({}).populate("level").exec();

  return costumers;
}

export async function getCustomersLevelsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const costumersLevels = await CustomerLevel.find({});

  return costumersLevels;
}

export async function saveCustomerData({ curp, name, cell, street, suburb, city, sector, residenceRef, nameRef, telRef,maps, level }) {

  if (!isConnected()) {
    await connectToDatabase();
  }
  const cityFromDb = await City.findById(city);
  if (!cityFromDb) {
    throw new Error("Ciudad no válida");
  }
  const sectorFromDb = cityFromDb.sectors.filter((s) =>{ 
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
  const residence = await new Residence({street, suburb, city, residenceRef, nameRef, telRef, maps, createdAt:currentDate, updatedAt:currentDate}).save();
  if(!residence){
    throw new Error("Error al guardar cliente. Por favor intente de nuevo.");
  }
  // set residence to new customer
  const newCustomer = await new Customer({ curp, name, cell, residences: [residence], currentResidence: residence, level, createdAt:currentDate, updatedAt:currentDate}).save();  
  return true;
}
