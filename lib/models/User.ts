import mongoose, { Model, model, Schema } from 'mongoose';
import { hash, compare, genSalt } from 'bcryptjs';
export interface IUser extends Document {
  id: string;
  name: string;
  role: Schema.Types.ObjectId;
  isActive: boolean;
  password: string;
}

const UserSchema = new Schema<IUser>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: Schema.Types.ObjectId,
    ref:'roles',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
  mongoose.models.users || model('users', UserSchema);
