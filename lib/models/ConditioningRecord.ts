import mongoose, { Model, model, Schema } from 'mongoose';

export interface IConditioningRecord extends Document {
  warehouseMachine: Schema.Types.ObjectId;
  technician: Schema.Types.ObjectId;
  status: string;
  assignedAt: Date;
  completedAt: Date;
  conditioningPhotos: [String];
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const ConditioningRecordSchema = new Schema<IConditioningRecord>({
  warehouseMachine: {
    type: Schema.Types.ObjectId,
    ref: 'warehouse_machines',
    required: true
  },
  technician: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  status: { type: String, enum: ['PENDIENTE', 'COMPLETADO'], default: 'PENDIENTE' },
  assignedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  conditioningPhotos: { type: [String], default: [] },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const ConditioningRecord: Model<IConditioningRecord> =
  mongoose.models.conditioning_records ||
  model('conditioning_records', ConditioningRecordSchema);
