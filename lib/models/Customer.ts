import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  cell: string;
  email: string;
  residences: [Schema.Types.ObjectId];
  currentResidence: Schema.Types.ObjectId;
  level: Schema.Types.ObjectId;
  comments: string;
  howFound: string;
  wasReferred: boolean;
  referrals: [Schema.Types.ObjectId];
  referredBy: Schema.Types.ObjectId;
  freeWeeks: number;
  firstRentAt: Date;
  hasRent: boolean;
  currentRent: Schema.Types.ObjectId;
  movements: [Schema.Types.ObjectId];
  balance: Number;
  payDayChanged: boolean;
  acumulatedDays: Number;
  totalRentWeeks: Number;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
  active: boolean;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: 'string', required: true },
  cell: { type: 'string', required: true },
  email: { type: 'string', default: '' },
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
  comments: { type: 'string', default:"" },
  howFound: { type: 'string', required: true },
  wasReferred: { type: 'boolean', default: false, required: true },
  referredBy: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'customers'
  },
  referrals: { type: [Schema.Types.ObjectId], default: [], ref: 'customers' },
  freeWeeks: { type: Number, default: 0 },
  hasRent: { type: 'boolean', default: false },
  firstRentAt: { type: Date, default: null },
  currentRent: { type: Schema.Types.ObjectId, default: null, ref: 'rents' },
  movements: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: 'customer_movements'
  },
  balance: { type: Number, default: 0 },
  payDayChanged: { type: 'boolean', default: false },
  acumulatedDays: { type: Number, default: 0 },
  totalRentWeeks: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  active: { type: 'boolean', default: true }
});
export const Customer: Model<ICustomer> =
  mongoose.models.customers || model('customers', CustomerSchema);
