import mongoose, { Model, model, Schema } from 'mongoose';

export interface IPrices extends Document {
  newWeekPrice: number;
  twoWeekPrice: number;
  threeWeekPrice: number;
  dayPrice: number;
  // Monto que se paga a un operador por cada vuelta (entrega, recolección,
  // cambio, cobranza, etc.) completada. Configurable por instancia/ciudad.
  vueltaPrice: number;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const PricesSchema = new Schema<IPrices>({
  newWeekPrice: { type: Number, required: true },
  twoWeekPrice: { type: Number, required: true },
  threeWeekPrice: { type: Number, required: true },
  dayPrice: { type: Number, required: true },
  vueltaPrice: { type: Number, default: 25 },
  updatedAt: { type: Date, default: null },
  lastUpdatedBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' }
});
export const Prices: Model<IPrices> =
  mongoose.models.prices || model('prices', PricesSchema);
