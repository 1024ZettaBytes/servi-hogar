import mongoose, { Model, model, Schema } from 'mongoose';
import { hash, compare, genSalt } from 'bcryptjs';
export interface IUser extends Document {
  id: string;
  name: string;
  role: Schema.Types.ObjectId;
  isActive: boolean;
  isBlocked: boolean;
  password: string;
  startM: number;
  endM: number;
  auxActionTimestamps?: Date[];
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
  isBlocked: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  startM: {
    type: Number,
    default: -1
  },
  endM: {
    type: Number,
    default: -1
  },
  auxActionTimestamps: {
    type: [Date],
    default: []
  }
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
