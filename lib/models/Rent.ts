import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRent extends Document {
  num: Number;
  status: Schema.Types.ObjectId;
  customer: Schema.Types.ObjectId;
  machine: Schema.Types.ObjectId;
  accesories: object;
  imagesUrl: object;
  initialWeeks: Number;
  initialPay: Number;
  usedFreeWeeks: Number;
  startDate: Date;
  endDate: Date;
  consecutiveChanges: Number;
  totalChanges: Number;
  acumulatedDays: number;
  extendedTimes: number;
  totalWeeks: number;
  lastUpdatedBy: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>({
  num: { type: Number, default: -1 },
  status: {
    type: Schema.Types.ObjectId,
    ref: 'rent_statuses',
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'customers',
    required: true
  },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'machines',
    default: null
  },
  accesories:{ 
    type: Object,
    default:{}
  },
  imagesUrl:{ 
    type: Object,
    default:{}
  },
  initialWeeks: { type: 'number', required: true },
  initialPay: { type: 'number', required: true },
  usedFreeWeeks: { type: 'number', required: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  consecutiveChanges: { type: Number, default:0},
  totalChanges: { type: Number, default:0},
  acumulatedDays: { type: 'number', default: 0 },
  extendedTimes: { type: 'number', default: 0 },
  totalWeeks: { type: 'number', default: 0 },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});
export const Rent: Model<IRent> =
  mongoose.models.rents || model('rents', RentSchema);
