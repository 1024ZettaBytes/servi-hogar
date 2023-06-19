import { connectToDatabase, isConnected } from "../db";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { RentDelivery } from "../models/RentDelivery";
import { RentChange } from "../models/RentChange";
import { RentPickup } from "../models/RentPickup";

export async function getOperatorsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const operatorRole = await Role.findOne({ id: "OPE" }).lean();
  const operators = await User.find({ role: operatorRole._id }).select({
    _id: 1,
    name: 1,
  });
  return operators;
}

export async function asignOperatorData({
  type,
  id,
  selectedOperator,
  lastUpdatedBy,
}) {
  let error = new Error();
  error.name = "Internal";
  const currentDate = Date.now();
  try {
    if (!isConnected()) {
      await connectToDatabase();
    }
    const operator = await User.findById(selectedOperator);
    if (!operator) {
      error.message = "El operador indicado no existe.";
      throw error;
    }
    let record;
    switch (type) {
      case "delivery":
        record = await RentDelivery.findById(id);
        break;
      case "change":
        record = await RentChange.findById(id);
        break;
      case "pickup":
        record = await RentPickup.findById(id);
    }
    if (!record) {
      error.message = "Parámetros incorrectos.";
      throw error;
    }
    record.operator = operator;
    record.lastUpdatedBy = lastUpdatedBy;
    record.updatedAt = currentDate;
    await record.save();
  } catch (e) {
    if (e.name === "Internal") throw e;
    else {
      console.error(e);
      throw new Error(
        "Ocurrío un error al asignar el operador de pago. Intente de nuevo."
      );
    }
  }
}
