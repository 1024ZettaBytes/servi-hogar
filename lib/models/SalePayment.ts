import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISalePayment extends Document {
  sale: Schema.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  weeksCovered: number;
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
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  createdAt: { type: Date, required: true }
});

export const SalePayment: Model<ISalePayment> =
  mongoose.models.salepayments || model('salepayments', SalePaymentSchema);
