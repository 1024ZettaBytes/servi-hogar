import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRole extends Document {
  id: string;
  name: string;
}

const RoleSchema= new Schema<IRole>({
  id: { type: 'string' },
  name: { type: 'string' },
});
export const Role: Model<IRole> =
  mongoose.models.roles || model('roles', RoleSchema);
