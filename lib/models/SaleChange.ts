import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISaleChange extends Document {
  totalNumber: number;
  dayNumber: number;
  sale: Schema.Types.ObjectId;
  pickedMachine: Schema.Types.ObjectId;
  leftMachine: Schema.Types.ObjectId;
  status: string;
  reason: string;
  cancellationReason: string;
  date: Date;
  timeOption: string;
  fromTime: Date;
  endTime: Date;
  wasSent: boolean;
  imagesUrl: {
    front: string;
    tag: string;
  };
  operator: Schema.Types.ObjectId;
  scheduledTime: Date;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  finishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const SaleChangeSchema = new Schema<ISaleChange>({
  totalNumber: { type: Schema.Types.Number, required: true },
  dayNumber: { type: Schema.Types.Number, required: true },
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'sales',
    required: true
  },
  pickedMachine: {
    type: Schema.Types.ObjectId,
    ref: 'sales_machines',
    default: null
  },
  leftMachine: {
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
  cancellationReason: { type: String, default: '' },
  date: { type: Date, required: true },
  timeOption: { type: String, required: true },
  fromTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  wasSent: { type: Boolean, default: false },
  imagesUrl: {
    type: {
      front: { type: String, default: '' },
      tag: { type: String, default: '' }
    },
    default: null
  },
  operator: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  scheduledTime: { type: Date, default: null },
  takenAt: { type: Date, default: null },
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  finishedAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const SaleChange: Model<ISaleChange> =
  mongoose.models.sale_changes || model('sale_changes', SaleChangeSchema);
