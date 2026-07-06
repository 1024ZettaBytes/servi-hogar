import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>({
  key: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastUpdatedBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' }
});

export const FeatureFlag: Model<IFeatureFlag> =
  mongoose.models.feature_flags || model('feature_flags', FeatureFlagSchema);
