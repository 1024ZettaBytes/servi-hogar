import mongoose, { Model, model, Schema } from 'mongoose';

export interface IPayout extends Document {
  type: string;
  status: string;
  incomeAmount: number;
  placement: number;
  mantainance: number;
  mantainancePercentage: number;
  comision: number;
  comisionPercentage: number;
  toPay: number;
  voucherUrl: string;
  machine: Schema.Types.ObjectId;
  partner: Schema.Types.ObjectId;
  createdAt: Date;
  completedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const PayoutSchema = new Schema<IPayout>({
  type: { type: String, default: 'EXTEND' },
  status: { type: String, default: 'PENDING' },
  incomeAmount: { type: Number, required: true },
  placement: { type: Number, default: 0 },
  mantainance: { type: Number, required: true },
  mantainancePercentage: { type: Number, required: true },
  comision: { type: Number, required: true },
  comisionPercentage: { type: Number, required: true },
  toPay: { type: Number, default: 0 },
  voucherUrl: { type: String, default: null },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'machines',
    required: true
  },
  partner: {
    type: Schema.Types.ObjectId,
    ref: 'machines',
    required: true
  },
  createdAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const Payout: Model<IPayout> =
  mongoose.models.payouts || model('payouts', PayoutSchema);
