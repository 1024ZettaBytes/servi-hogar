import mongoose, { Document, Model, model, Schema } from 'mongoose';

export interface IToolResetLog extends Document {
  resetDate: Date;
  periodKey: string; // e.g. "2026-01", "2026-05", "2026-09"
  assignmentsReset: number;
  createdAt: Date;
}

const ToolResetLogSchema = new Schema<IToolResetLog>({
  resetDate: {
    type: Date,
    required: true
  },
  periodKey: {
    type: String,
    required: true,
    unique: true
  },
  assignmentsReset: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const ToolResetLog: Model<IToolResetLog> =
  mongoose.models.ToolResetLog ||
  model<IToolResetLog>('ToolResetLog', ToolResetLogSchema, 'tool_reset_logs');
