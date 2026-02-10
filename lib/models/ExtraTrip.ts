import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface IExtraTrip extends Document {
  tripNumber: number;
  destination: string;
  reason: string;
  status: string;
  assignedTo: Schema.Types.ObjectId;
  assignedBy: Schema.Types.ObjectId;
  assignedAt: Date;
  completedAt: Date;
  completedBy: Schema.Types.ObjectId;
  notes: string;
  completionNotes: string;
  scheduledTime: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const ExtraTripSchema = new Schema<IExtraTrip>({
  tripNumber: { type: Number, required: true, unique: true },
  destination: { type: String, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDIENTE', 'ASIGNADA', 'COMPLETADA', 'CANCELADA'],
    default: 'PENDIENTE'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  assignedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  notes: { type: String, default: '' },
  completionNotes: { type: String, default: '' },
  scheduledTime: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const ExtraTrip: Model<IExtraTrip> =
  mongoose.models.extra_trips || model('extra_trips', ExtraTripSchema);
