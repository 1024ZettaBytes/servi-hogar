import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISalePickup extends Document {
  totalNumber: number;
  dayNumber: number;
  sale: Schema.Types.ObjectId;
  machine: Schema.Types.ObjectId;
  status: string; // ESPERA, ASIGNADA, COMPLETADA, CANCELADA
  reason: string;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  date: Date;
  imagesUrl: {
    front: string;
    tag: string;
  };
  timeOption: string;
  fromTime: Date;
  endTime: Date;
  wasSent: boolean;
  cancellationReason: string;
  promise: Date;
  finishedAt: Date;
  operator: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const SalePickupSchema = new Schema<ISalePickup>({
  totalNumber: { type: Schema.Types.Number, required: true },
  dayNumber: { type: Schema.Types.Number, required: true },
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'sales',
    required: true
  },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'sales_machines',
    required: true
  },
  status: {
    type: String,
    enum: ['ESPERA', 'ASIGNADA', 'COMPLETADA', 'CANCELADA'],
    default: 'ESPERA'
  },
  reason: { type: String, required: true },
  takenAt: { type: Date, default: null },
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  date: { type: Date, required: true },
  imagesUrl: {
    type: {
      front: { type: String, default: '' },
      tag: { type: String, default: '' }
    },
    default: null
  },
  timeOption: { type: String, required: true },
  fromTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  wasSent: { type: Boolean, default: false },
  promise: { type: Date, default: null },
  cancellationReason: { type: String, default: '' },
  finishedAt: { type: Date, default: null },
  operator: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const SalePickup: Model<ISalePickup> =
  mongoose.models.sale_pickups || model('sale_pickups', SalePickupSchema);
