import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomerLevel extends Document {
  id: string;
  name: string;
  weekPrice: number;
  dayPrice: number;
}

const CustomerLevelSchema = new Schema<ICustomerLevel>({
  id: { type: 'string' },
  name: { type: 'string' },
  weekPrice: { type: Number, required: true},
  dayPrice: { type: Number, required: true}
});
export const CustomerLevel: Model<ICustomerLevel> =
  mongoose.models.customer_levels || model('customer_levels', CustomerLevelSchema);
