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
  imagesUrl: object;
  timeOption: string,
  fromTime: Date,
  endTime:Date,
  wasSent: boolean;
  cancellationReason: string;
  promise: Date;
  reason: string;
  finishedAt: Date;
  operator: Schema.Types.ObjectId;
  scheduledTime: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
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
  imagesUrl:{ 
    type: Object,
    default:null
  },
  timeOption: { type: String, required:true },
  fromTime: { type: Date, required: true },
  endTime:{ type: Date, required: true },
  wasSent: { type: Boolean, required:false},
  reason: { type: String, default: '' },
  promise: { type: Date, default: null },
  cancellationReason: { type: String, default: '' },
  finishedAt: { type: Date, default: null },
  operator: { type: Schema.Types.ObjectId, default:null, ref: 'users' },
  scheduledTime: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const RentPickup: Model<IRentPickup> =
  mongoose.models.rent_pickups ||
  model('rent_pickups', RentPickupSchema);
