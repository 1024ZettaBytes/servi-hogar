import mongoose, { Model, model, Schema } from 'mongoose';

export interface IMachineStatus extends Document {
  id: string;
  description: string;
  typeWarehouse: boolean;
  active: boolean;
}

const MachineStatusSchema = new Schema<IMachineStatus>({
  id: { type: String, required: true },
  description: { type: String, required: true },
  active: { type: 'boolean', default: true },
  typeWarehouse: { type: 'boolean', default: true }
});

export const MachineStatus: Model<IMachineStatus> =
  mongoose.models.machine_statuses ||
  model('machine_statuses', MachineStatusSchema);
