import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRecord extends Document {
  id: String;
  date: Date;
  _record: Object;
}

const RecordSchema = new Schema<IRecord>({
  id: { type: String, required: true },
  date: { type: Date, required: true },
  _record: { type: Object, required: true }
});
export const Record: Model<IRecord> =
  mongoose.models.records || model('records', RecordSchema);
