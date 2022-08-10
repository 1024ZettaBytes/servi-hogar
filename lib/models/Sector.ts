import mongoose, { Model, model, Schema } from 'mongoose';

export interface ISector extends Document {
  id: string;
  name: string;
}

const SectorSchema = new Schema<ISector>({
  id: { type: 'string', required: true},
  name: { type: 'string', required: true},
});
export const Sector: Model<ISector> =
  mongoose.models.sectors || model('sectors', SectorSchema);
