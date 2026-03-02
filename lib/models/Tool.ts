import mongoose, { Document, Model, model, Schema } from 'mongoose';

export interface ITool extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
}

const ToolSchema = new Schema<ITool>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Tool: Model<ITool> =
  mongoose.models.tools || model('tools', ToolSchema);
