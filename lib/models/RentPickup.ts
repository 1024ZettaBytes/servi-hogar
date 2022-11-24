import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRentPickup extends Document {
  totalNumber: number;
  dayNumber: number;
  rent: Schema.Types.ObjectId;
  status: string;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  pickedAccesories: object;
  date: Date,
  timeOption: string,
  fromTime: Date,
  endTime:Date,
  cancellationReason: string;
  finishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const RentPickupSchema = new Schema<IRentPickup>({
  totalNumber: { type: Schema.Types.Number, required: true },
  dayNumber: { type: Schema.Types.Number, required: true },
  rent: {
    type: Schema.Types.ObjectId,
    ref: 'rents',
    required: true
  },
  status: { type: String, default: 'ESPERA' },
  takenAt: { type: Date, default: null },
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'operators',
    default: null
  },
  pickedAccesories: {type: Object, default: {}},
  date: { type: Date, required: true },
  timeOption: { type: String, required:true },
  fromTime: { type: Date, required: true },
  endTime:{ type: Date, required: true },
  cancellationReason: { type: String, default: '' },
  finishedAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const RentPickup: Model<IRentPickup> =
  mongoose.models.rent_pickups ||
  model('rent_pickups', RentPickupSchema);
