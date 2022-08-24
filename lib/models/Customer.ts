import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  cell: string;
  residences: [Schema.Types.ObjectId];
  currentResidence: Schema.Types.ObjectId;
  level: Schema.Types.ObjectId;
  howFound: string;
  wasReferred: boolean;
  referrals: [Schema.Types.ObjectId];
  referredBy: Schema.Types.ObjectId;
  freeWeeks: number;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
  active: boolean;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: 'string', required: true },
  cell: { type: 'string', required: true },
  residences: [
    {
      type: Schema.Types.ObjectId,
      ref: 'residences',
      required: true
    }
  ],
  currentResidence: {
    type: Schema.Types.ObjectId,
    ref: 'residences',
    required: true
  },
  level: {
    type: Schema.Types.ObjectId,
    ref: 'customer_levels',
    required: true
  },
  howFound: { type: 'string', required: true },
  wasReferred: { type: 'boolean', default: false, required: true },
  referredBy: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'customers'
  },
  referrals: { type: [Schema.Types.ObjectId], default: [], ref: 'customers' },
  freeWeeks: { type: 'number', default: 0 },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  active: { type: 'boolean', default: true }
});
export const Customer: Model<ICustomer> =
  mongoose.models.customers || model('customers', CustomerSchema);
