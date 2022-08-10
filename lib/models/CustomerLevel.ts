import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomerLevel extends Document {
  id: string;
  name: string;
}

const CustomerLevelSchema = new Schema<ICustomerLevel>({
  id: { type: 'string' },
  name: { type: 'string' },
});
export const CustomerLevel: Model<ICustomerLevel> =
  mongoose.models.customer_levels || model('customer_levels', CustomerLevelSchema);
