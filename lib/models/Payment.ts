import mongoose, { Model, model, Schema } from 'mongoose';

export interface IPayment extends Document {
  number: number;
  amount: number;
  customer: Schema.Types.ObjectId;
  reason: string;
  description: string;
  method: string;
  folio: string;
  voucherUrl: string;
  date: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const PaymentSchema = new Schema<IPayment>({
  number: { type: Number, required:true},
  amount: { type: Number, required:true},
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'customers',
    required: true
  },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  method: { type: String, required: true },
  folio: { type:String, default:null },
  voucherUrl: { type: String, default:null },
  date: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const Payment: Model<IPayment> =
  mongoose.models.payments || model('payments', PaymentSchema);
