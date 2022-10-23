import mongoose, { Model, model, Schema } from 'mongoose';

export interface IPrices extends Document {
  weekPrice: number;
  dayPrice: number;
}

const PricesSchema = new Schema<IPrices>({
  weekPrice: { type: Number, required: true },
  dayPrice: { type: Number, required: true }
});
export const Prices: Model<IPrices> =
  mongoose.models.prices || model('prices', PricesSchema);