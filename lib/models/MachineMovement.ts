import mongoose, { Model, model, Schema } from 'mongoose';

export interface IMachineMovement extends Document {
  machine: Schema.Types.ObjectId;
  type: string;
  description: string;
  amount: number;
  date: Date;
}

const MachineMovementSchema = new Schema<IMachineMovement>({
  machine: { type: Schema.Types.ObjectId, required: true, ref: 'machines' },
  type: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true }
});

export const MachineMovement: Model<IMachineMovement> =
  mongoose.models.machine_movements ||
  model('machine_movements', MachineMovementSchema);
