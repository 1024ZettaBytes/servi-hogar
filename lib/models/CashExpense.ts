import mongoose, { Model, model, Schema, Document } from 'mongoose';

/**
 * Gasto o compra pagada con el efectivo de la caja de oficina. Descuenta del
 * saldo de la caja y siempre exige recibo. Queda ligado al corte que lo cierra
 * (`cashCut`), igual que los cobros, para que ningún gasto se cuente dos veces.
 */
export interface ICashExpense extends Document {
  expenseNumber: number;
  concept: string;
  description: string;
  amount: number;
  receiptUrl: string;
  date: Date;
  cashCut: Schema.Types.ObjectId;
  edits: {
    field: string;
    previousValue: number;
    newValue: number;
    reason: string;
    editedBy: Schema.Types.ObjectId;
    editedAt: Date;
  }[];
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const CashExpenseSchema = new Schema<ICashExpense>({
  expenseNumber: { type: Number, required: true },
  concept: { type: String, required: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  receiptUrl: { type: String, required: true },
  date: { type: Date, required: true },
  // null = todavía no entra en ningún corte
  cashCut: { type: Schema.Types.ObjectId, ref: 'cash_cuts', default: null },
  edits: [
    {
      field: { type: String, required: true },
      previousValue: { type: Number, default: null },
      newValue: { type: Number, default: null },
      reason: { type: String, default: '' },
      editedBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
      editedAt: { type: Date, required: true }
    }
  ],
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

CashExpenseSchema.index({ cashCut: 1 });
CashExpenseSchema.index({ date: -1 });

export const CashExpense: Model<ICashExpense> =
  mongoose.models.cash_expenses || model('cash_expenses', CashExpenseSchema);
