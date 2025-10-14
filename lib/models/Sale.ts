import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISale extends Document {
  saleNum: number;
  machine: Schema.Types.ObjectId;
  serialNumber: string;
  customer: Schema.Types.ObjectId;
  totalAmount: number;
  initialPayment: number;
  remainingAmount: number;
  weeklyPayment: number;
  totalWeeks: number;
  paidWeeks: number;
  accumulatedPayment: number;
  isPaid: boolean;
  status: string;
  saleDate: Date;
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const SaleSchema = new Schema<ISale>({
  saleNum: { type: Number, required: true, unique: true },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'machines',
    default: null
  },
  serialNumber: { type: String, default: '' },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'customers',
    default: null
  },
  totalAmount: { type: Number, required: true },
  initialPayment: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  weeklyPayment: { type: Number, required: true },
  totalWeeks: { type: Number, required: true },
  paidWeeks: { type: Number, default: 0 },
  accumulatedPayment: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['ACTIVA', 'PAGADA', 'CANCELADA'],
    default: 'ACTIVA'
  },
  saleDate: { type: Date, required: true },
  lastPaymentDate: { type: Date, default: null },
  nextPaymentDate: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const Sale: Model<ISale> =
  mongoose.models.sales || model('sales', SaleSchema);
