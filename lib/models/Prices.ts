import mongoose, { Model, model, Schema } from 'mongoose';

export interface IPrices extends Document {
  newWeekPrice: number;
  twoWeekPrice: number;
  threeWeekPrice: number;
  dayPrice: number;
}

const PricesSchema = new Schema<IPrices>({
  newWeekPrice: { type: Number, required: true },
  twoWeekPrice: { type: Number, required: true },
  threeWeekPrice: { type: Number, required: true },
  dayPrice: { type: Number, required: true }
});
export const Prices: Model<IPrices> =
  mongoose.models.prices || model('prices', PricesSchema);
