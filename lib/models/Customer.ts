import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomer extends Document {
  curp: string;
  name: string;
  cell: string;
  residences: [Schema.Types.ObjectId];
  currentResidence: Schema.Types.ObjectId;
  level: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  curp: { type: 'string', required: true },
  name: { type: 'string', required: true },
  cell: { type: 'string', required: true },
  residences: [
    {
      type: Schema.Types.ObjectId,
      ref: 'residences',
      required: true
    }
  ],
  currentResidence: 
    {
      type: Schema.Types.ObjectId,
      ref: 'residences',
      required: true
    }
  ,
  level: {
    type: Schema.Types.ObjectId,
    ref: 'customer_levels',
    required: true
  },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true }
});
export const Customer: Model<ICustomer> =
  mongoose.models.Customer || model('Customer', CustomerSchema);
