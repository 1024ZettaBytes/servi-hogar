import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface IPaymentAccount extends Document {
  count: number;
  bank: string;
  number: string;
  type: 'CARD' | 'CLABE' | 'ACCOUNT';
}

const PaymentAccountSchema = new Schema<IPaymentAccount>({
  count: { type: Number, required: true },
  bank: { type: String, required: true },
  number: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['CARD', 'CLABE', 'ACCOUNT']
  }
});

export const PaymentAccount: Model<IPaymentAccount> =
  mongoose.models.payment_accounts || model('payment_accounts', PaymentAccountSchema);
