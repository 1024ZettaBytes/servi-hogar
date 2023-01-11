import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRentDelivery extends Document {
  totalNumber: number;
  dayNumber: number;
  rent: Schema.Types.ObjectId;
  status: string;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  leftAccesories: object;
  date: Date;
  timeOption: string;
  fromTime: Date;
  endTime: Date;
  finishedAt: Date;
  cancellationReason: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const RentDeliverySchema = new Schema<IRentDelivery>({
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
  leftAccesories: { type: Object, default: {} },
  date: { type: Date, required: true },
  timeOption: { type: String, required: true },
  fromTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  finishedAt: { type: Date, default: null },
  cancellationReason: { type: String, default: '' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const RentDelivery: Model<IRentDelivery> =
  mongoose.models.rent_deliveries ||
  model('rent_deliveries', RentDeliverySchema);
