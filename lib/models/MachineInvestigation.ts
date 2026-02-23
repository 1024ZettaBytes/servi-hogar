import mongoose, { Model, model, Schema } from 'mongoose';

export interface IMachineInvestigation extends Document {
  machine: Schema.Types.ObjectId;
  pickup: Schema.Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const MachineInvestigationSchema = new Schema<IMachineInvestigation>({
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'machines',
    required: true
  },
  pickup: {
    type: Schema.Types.ObjectId,
    ref: 'rent_pickups',
    required: true
  },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const MachineInvestigation: Model<IMachineInvestigation> =
  mongoose.models.machine_investigations ||
  model('machine_investigations', MachineInvestigationSchema);
