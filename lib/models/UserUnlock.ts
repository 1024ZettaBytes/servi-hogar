import mongoose from 'mongoose';

export interface UserUnlockType {
  user: mongoose.Types.ObjectId;
  unlockedBy: mongoose.Types.ObjectId;
  unlockedByRole: string;
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
  // Role of the user that performed the unlock at the time it happened
  // (e.g. 'ADMIN', 'AUX'). Used to enforce the daily unlock limit AUX users
  // have on OPE users without re-deriving it from the (possibly since
  // changed) unlockedBy user record.
  unlockedByRole: {
    type: String,
    default: null
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
