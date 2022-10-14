import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRentStatus extends Document {
  id: string;
  description: string;
  active: boolean;
}

const RentStatusSchema = new Schema<IRentStatus>({
  id: { type: String, required: true },
  description: { type: String, required: true },
  active: { type: 'boolean', default: true },
});

export const RentStatus: Model<IRentStatus> =
  mongoose.models.machine_statuses ||
  model('rent_statuses', RentStatusSchema);
