import mongoose from 'mongoose';

export interface UserUnlockType {
  user: mongoose.Types.ObjectId;
  unlockedBy: mongoose.Types.ObjectId;
  reason: string;
  unlockedAt: Date;
}

const UserUnlockSchema = new mongoose.Schema<UserUnlockType>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  unlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
});

export const UserUnlock =
  (mongoose.models.UserUnlock as mongoose.Model<UserUnlockType>) ||
  mongoose.model<UserUnlockType>('UserUnlock', UserUnlockSchema);
