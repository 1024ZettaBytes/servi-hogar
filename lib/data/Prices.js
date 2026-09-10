import { connectToDatabase, isConnected } from "../db";
import { Prices } from "../models/Prices"

export async function getPricesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const prices = await Prices.findOne();
  return prices;
}

export async function updateVueltaPriceData({ vueltaPrice, lastUpdatedBy }) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  if (typeof vueltaPrice !== 'number' || isNaN(vueltaPrice) || vueltaPrice < 0) {
    const error = new Error('Indique un precio por vuelta válido.');
    error.name = 'Internal';
    throw error;
  }
  const updated = await Prices.findOneAndUpdate(
    {},
    { $set: { vueltaPrice, updatedAt: new Date(), lastUpdatedBy } },
    { new: true }
  );
  if (!updated) {
    const error = new Error(
      'No se encontró la configuración de precios base para actualizar.'
    );
    error.name = 'Internal';
    throw error;
  }
  return updated;
}
