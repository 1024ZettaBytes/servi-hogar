import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICurrentRentsLog extends Document {
  amount: number;
  dateText: string;
}

const CurrentRentsLogSchema = new Schema<ICurrentRentsLog>({
  amount: { type: Number, required: true },
  dateText: { type: String, required: true }
});

export const CurrentRentsLog: Model<ICurrentRentsLog> =
  mongoose.models.current_rents_log ||
  model('current_rents_log', CurrentRentsLogSchema);
