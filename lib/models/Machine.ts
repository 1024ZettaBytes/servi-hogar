import mongoose, { Model, model, Schema } from 'mongoose';

export interface IMachine extends Document {
  machineNum: number;
  brand: string;
  capacity: string;
  cost: number;
  expenses: number;
  earnings: number;
  status: Schema.Types.ObjectId;
  lastRent: Schema.Types.ObjectId;
  movements: [Schema.Types.ObjectId];
  totalChanges: number;
  imageUrl: String,
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
  active: boolean;
}

const MachineSchema = new Schema<IMachine>({
  machineNum: { type: Number, required: true },
  brand: { type: String, required: true },
  capacity: { type: String, required: true },
  cost: { type: Number, required: true },
  expenses: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  status: {
    type: Schema.Types.ObjectId,
    ref: 'machine_statuses',
    required: true
  },
  lastRent: { type: Schema.Types.ObjectId, ref: 'rents', default: null },
  movements: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: 'machine_movements'
  },
  totalChanges: { type: Number, default: 0 },
  imageUrl: { type: String, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  active: { type: 'boolean', default: true }
});

export const Machine: Model<IMachine> =
  mongoose.models.machines || model('machines', MachineSchema);
