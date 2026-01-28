import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISalePayment extends Document {
  sale: Schema.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  weeksCovered: number;
  imageUrl?: string;
  method: 'TRANSFER' | 'DEP' | 'CASH' | 'CASH_OFFICE';
  paymentAccount?: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const SalePaymentSchema = new Schema<ISalePayment>({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'sales',
    required: true
  },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  weeksCovered: { type: Number, required: true },
  imageUrl: { type: String, default: null },
  method: {
    type: String,
    enum: ['TRANSFER', 'DEP', 'CASH', 'CASH_OFFICE'],
    required: true
  },
  paymentAccount: { type: Schema.Types.ObjectId, ref: 'paymentAccounts', default: null },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  createdAt: { type: Date, required: true }
});

export const SalePayment: Model<ISalePayment> =
  mongoose.models.salepayments || model('salepayments', SalePaymentSchema);
