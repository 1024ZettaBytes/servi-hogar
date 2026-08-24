import mongoose, { Model, model, Schema, Document } from 'mongoose';

/**
 * Corte de caja. Cubre dos operaciones distintas:
 *
 * - RUTA: el personal de calle (operadores) cobra efectivo de entregas de
 *   reparaciones externas y de cobranza de créditos. El corte le indica cuánto
 *   debe entregar y queda pendiente hasta que sube el comprobante de depósito.
 *
 * - OFICINA: la caja de oficina es un saldo corrido del que también salen
 *   gastos y compras. Al terminar un turno se declara el total físico en caja
 *   y se elige a quién se entrega; esa persona cuenta y confirma el monto.
 *
 * El periodo que cubre un corte no se define por fechas sino por los cobros
 * que aún no han sido cortados (`cashCut: null` en payments/salepayments), de
 * modo que un cobro registrado con fecha atrasada nunca se pierde ni se
 * cuenta dos veces.
 */
export interface ICashCut extends Document {
  cutNumber: number;
  type: 'RUTA' | 'OFICINA';
  user: Schema.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  previousBalance: number;
  cashIn: number;
  expensesTotal: number;
  systemAmount: number;
  declaredAmount: number;
  difference: number;
  status: string;
  notes: string;
  // RUTA
  depositAccount: Schema.Types.ObjectId;
  depositAmount: number;
  depositFolio: string;
  depositReceiptUrl: string;
  depositedAt: Date;
  // OFICINA
  handedToUser: Schema.Types.ObjectId;
  confirmedAmount: number;
  confirmedAt: Date;
  confirmedBy: Schema.Types.ObjectId;
  // Auditoría de correcciones hechas por el administrador
  edits: {
    field: string;
    previousValue: number;
    newValue: number;
    reason: string;
    editedBy: Schema.Types.ObjectId;
    editedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const CashCutSchema = new Schema<ICashCut>({
  cutNumber: { type: Number, required: true },
  type: {
    type: String,
    enum: ['RUTA', 'OFICINA'],
    required: true
  },
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  periodStart: { type: Date, default: null },
  periodEnd: { type: Date, required: true },
  // Saldo con el que abrió la caja (solo aplica a OFICINA)
  previousBalance: { type: Number, default: 0 },
  // Efectivo cobrado dentro del corte
  cashIn: { type: Number, default: 0 },
  // Gastos y compras pagados de la caja dentro del corte (solo OFICINA)
  expensesTotal: { type: Number, default: 0 },
  // Lo que el sistema calcula que debe haber
  systemAmount: { type: Number, required: true },
  // Lo que la persona declara al hacer el corte
  declaredAmount: { type: Number, required: true },
  // declaredAmount - systemAmount (negativo = faltante)
  difference: { type: Number, default: 0 },
  status: {
    type: String,
    enum: [
      'PENDIENTE_DEPOSITO',
      'DEPOSITADO',
      'PENDIENTE_CONFIRMACION',
      'CONFIRMADO'
    ],
    required: true
  },
  notes: { type: String, default: '' },
  depositAccount: {
    type: Schema.Types.ObjectId,
    ref: 'payment_accounts',
    default: null
  },
  depositAmount: { type: Number, default: null },
  depositFolio: { type: String, default: null },
  depositReceiptUrl: { type: String, default: null },
  depositedAt: { type: Date, default: null },
  handedToUser: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  confirmedAmount: { type: Number, default: null },
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
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
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

CashCutSchema.index({ type: 1, periodEnd: -1 });
CashCutSchema.index({ user: 1, periodEnd: -1 });

export const CashCut: Model<ICashCut> =
  mongoose.models.cash_cuts || model('cash_cuts', CashCutSchema);
