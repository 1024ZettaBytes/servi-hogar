import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRent extends Document {
  num: Number,
  status: Schema.Types.ObjectId;
  customer: Schema.Types.ObjectId;
  machine: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  payDayChanged: boolean;
  extendedTimes: number;
  consecutiveWeeks: number;
  lastUpdatedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>({
  num:{type: Number},
  status: 
    {
      type: Schema.Types.ObjectId,
      ref: 'rent_statuses',
      required: true
    }
  ,
  customer: 
    {
      type: Schema.Types.ObjectId,
      ref: 'customers',
      required: true
    }
  ,
  machine: 
    {
      type: Schema.Types.ObjectId,
      ref: 'machines',
      default: null
    }
  ,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  payDayChanged: { type: 'boolean', default: false },
  extendedTimes: { type: 'number', default: 0 },
  consecutiveWeeks: { type: 'number', default: 0 },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
});
export const Rent: Model<IRent> =
  mongoose.models.rents || model('rents', RentSchema);
