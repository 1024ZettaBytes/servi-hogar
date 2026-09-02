import mongoose, { Model, model, Schema } from 'mongoose';

// Un movimiento del saldo de semanas gratis: por qué se otorgó o dónde se usó.
// Sirve para explicar el saldo actual, no solo mostrar el número.
export interface IFreeWeekMovement {
  reason: string;
  weeks: number;
  date: Date;
  rent: Schema.Types.ObjectId;
  referral: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
}

export interface ICustomer extends Document {
  name: string;
  cell: string;
  email: string;
  residences: [Schema.Types.ObjectId];
  currentResidence: Schema.Types.ObjectId;
  level: Schema.Types.ObjectId;
  comments: string;
  howFound: string;
  wasReferred: boolean;
  referrals: [Schema.Types.ObjectId];
  referredBy: Schema.Types.ObjectId;
  freeWeeks: number;
  freeWeeksHistory: IFreeWeekMovement[];
  firstRentAt: Date;
  hasRent: boolean;
  currentRent: Schema.Types.ObjectId;
  movements: [Schema.Types.ObjectId];
  balance: Number;
  payDayChanged: boolean;
  acumulatedDays: Number;
  totalRentWeeks: Number;
  maxPayDays: Number;
  isPlanOro: boolean;
  isPlan99: boolean;
  hadPlan99Overdue: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
  active: boolean;
}

const FreeWeekMovementSchema = new Schema<IFreeWeekMovement>({
  // Uno de FREE_WEEK_REASONS: RECOMENDACION / CAMBIOS_CONSECUTIVOS / USO.
  reason: { type: String, required: true },
  // Siempre positivo: el signo lo da el motivo (USO resta, el resto suma).
  weeks: { type: Number, required: true },
  date: { type: Date, required: true },
  // Renta donde ocurrieron los cambios, o donde se aplicaron las semanas.
  rent: { type: Schema.Types.ObjectId, default: null, ref: 'rents' },
  // Cliente recomendado que generó la semana.
  referral: { type: Schema.Types.ObjectId, default: null, ref: 'customers' },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' }
});

const CustomerSchema = new Schema<ICustomer>({
  name: { type: 'string', required: true },
  cell: { type: 'string', required: true },
  email: { type: 'string', default: '' },
  residences: [
    {
      type: Schema.Types.ObjectId,
      ref: 'residences',
      required: true
    }
  ],
  currentResidence: {
    type: Schema.Types.ObjectId,
    ref: 'residences',
    required: true
  },
  level: {
    type: Schema.Types.ObjectId,
    ref: 'customer_levels',
    required: true
  },
  comments: { type: 'string', default:"" },
  howFound: { type: 'string', required: true },
  wasReferred: { type: 'boolean', default: false, required: true },
  referredBy: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'customers'
  },
  referrals: { type: [Schema.Types.ObjectId], default: [], ref: 'customers' },
  freeWeeks: { type: Number, default: 0 },
  freeWeeksHistory: { type: [FreeWeekMovementSchema], default: [] },
  hasRent: { type: 'boolean', default: false },
  firstRentAt: { type: Date, default: null },
  currentRent: { type: Schema.Types.ObjectId, default: null, ref: 'rents' },
  movements: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: 'customer_movements'
  },
  balance: { type: Number, default: 0 },
  payDayChanged: { type: 'boolean', default: false },
  acumulatedDays: { type: Number, default: 0 },
  totalRentWeeks: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  maxPayDays: { type: Number, default: 7 },
  isPlanOro: { type: 'boolean', default: false },
  isPlan99: { type: 'boolean', default: false },
  hadPlan99Overdue: { type: 'boolean', default: false },
  active: { type: 'boolean', default: true }
});
export const Customer: Model<ICustomer> =
  mongoose.models.customers || model('customers', CustomerSchema);
