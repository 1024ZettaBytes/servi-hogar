import mongoose, { Model, model, Schema } from 'mongoose';

export interface IMantainance extends Document {
  totalNumber: number;
  machine: Schema.Types.ObjectId;
  usedInventory: [Schema.Types.ObjectId];
  status: string;
  description: string;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  cancellationReason: string;
  finishedAt: Date;
  fromOperatorSkip: boolean;
  operatorSkipReason: string;
  skippedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const MantainanceSchema = new Schema<IMantainance>({
  totalNumber: { type: Schema.Types.Number, required: true },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'machines',
    required: true
  },
  usedInventory: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: 'used_inventory'
  },
  status: { type: String, default: 'PENDIENTE' },
  description: { type: String, default: null },
  takenAt: { type: Date, required: true },
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  cancellationReason: { type: String, default: '' },
  finishedAt: { type: Date, default: null },
  // Set when the maintenance originates from an operator skipping a defective
  // machine in the ready-to-load queue. These records must never be counted
  // in any technician report or payroll (rework, not a new paid maintenance).
  fromOperatorSkip: { type: Boolean, default: false },
  operatorSkipReason: { type: String, default: '' },
  skippedBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const Mantainance: Model<IMantainance> =
  mongoose.models.mantainances ||
  model('mantainances', MantainanceSchema);
