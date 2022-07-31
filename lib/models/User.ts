import mongoose, { Model, model, Schema } from 'mongoose';
import { hash, compare, genSalt } from 'bcryptjs';
export interface IUser extends Document {
  user: string;
  name: string;
  role: string;
  password: string;
}

const UserSchema: Schema = new Schema({
  user: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
});
UserSchema.methods.encryptPassword = async (psw) => {
  const salt = await genSalt(10);
  const hs = await hash(psw, salt);
  return hs.toString();
};
UserSchema.methods.matchPassword = async function (psw) {
  return await compare(psw, this.password);
};

export const User: Model<IUser> =
  mongoose.models.User || model('User', UserSchema);
