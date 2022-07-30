import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRole extends Document {
  id: string;
  name: string;
}

const RoleSchema: Schema = new Schema({
  id: { type: 'string' },
  name: { type: 'string' },
});
export const Role: Model<IRole> =
  mongoose.models.Role || model('Role', RoleSchema);
