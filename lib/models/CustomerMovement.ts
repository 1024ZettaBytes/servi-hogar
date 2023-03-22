import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomerMovement extends Document {
  customer: Schema.Types.ObjectId;
  rent: Schema.Types.ObjectId;
  machine: Schema.Types.ObjectId;
  type: string;
  description: string;
  date: Date;
}

const CustomerMovementSchema = new Schema<ICustomerMovement>({
  customer: { type: Schema.Types.ObjectId, required: true, ref:'customers' },
  rent: { type: Schema.Types.ObjectId, default: null, ref:'rents' },
  machine: { type: Schema.Types.ObjectId, default: null, ref:'machines' },
  type: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true }
});

export const CustomerMovement: Model<ICustomerMovement> =
  mongoose.models.customer_movements ||
  model('customer_movements', CustomerMovementSchema);
