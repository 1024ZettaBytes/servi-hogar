import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICity extends Document {
  id: string;
  name: string;
  sectors: [Schema.Types.ObjectId],
}

const CitySchema: Schema = new Schema({
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  sectors: [{ type: Schema.Types.ObjectId, ref: 'sectors', required: true }]
});
export const City: Model<ICity> =
  mongoose.models.cities || model('cities', CitySchema);
