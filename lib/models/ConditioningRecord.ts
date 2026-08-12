import mongoose, { Model, model, Schema } from 'mongoose';

export interface IConditioningRecord extends Document {
  warehouseMachine: Schema.Types.ObjectId;
  technician: Schema.Types.ObjectId;
  previousTechnician: Schema.Types.ObjectId;
  status: string;
  assignedAt: Date;
  completedAt: Date;
  conditioningPhotos: [String];
  isPayable: boolean;
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
  // Técnico que realizó el acondicionamiento anterior del equipo.
  // Solo se llena en retrabajos por CAMBIO_VENTA.
  previousTechnician: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  status: {
    type: String,
    enum: ['PENDIENTE', 'COMPLETADO', 'CANCELADO'],
    default: 'PENDIENTE'
  },
  assignedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  conditioningPhotos: { type: [String], default: [] },
  isPayable: { type: Boolean, default: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const ConditioningRecord: Model<IConditioningRecord> =
  mongoose.models.conditioning_records ||
  model('conditioning_records', ConditioningRecordSchema);
