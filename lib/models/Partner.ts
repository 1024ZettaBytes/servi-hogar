import mongoose, { Model, model, Schema } from 'mongoose';

export interface IPartner extends Document {
  machines: [Schema.Types.ObjectId];
  payouts: [Schema.Types.ObjectId];
  user: Schema.Types.ObjectId;
  createdAt: Date;
}

const PartnerSchema = new Schema<IPartner>({
  machines: { type: [Schema.Types.ObjectId], ref: 'machines', default: [] },
  payouts: { type: [Schema.Types.ObjectId], ref: 'payouts', default: [] },
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  createdAt: { type: Schema.Types.Date, required: true }
});

export const Partner: Model<IPartner> =
  mongoose.models.partners || model('partners', PartnerSchema);
