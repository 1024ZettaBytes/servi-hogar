import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface IRestDay {
  date: string; // Format: YYYY-MM-DD
  description: string;
  type: 'DESCANSO' | 'VACACIONES';
}

export interface IExtraItem {
  concept: string;
  amount: number;
}

export interface IAuxWeeklyPayroll extends Document {
  user: Schema.Types.ObjectId;
  weekStart: string; // Format: YYYY-MM-DD
  weekEnd: string; // Format: YYYY-MM-DD
  punctualityBonusApplied: boolean;
  restDays: IRestDay[];
  extraDeductions: IExtraItem[];
  extraPerceptions: IExtraItem[];
  salesCount: number;
  salesCommission: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const AuxWeeklyPayrollSchema = new Schema<IAuxWeeklyPayroll>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  weekStart: {
    type: String,
    required: true
  },
  weekEnd: {
    type: String,
    required: true
  },
  punctualityBonusApplied: {
    type: Boolean,
    default: true
  },
  restDays: [{
    date: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['DESCANSO', 'VACACIONES'], default: 'DESCANSO' }
  }],
  extraDeductions: [{
    concept: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  extraPerceptions: [{
    concept: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  salesCount: {
    type: Number,
    default: 0
  },
  salesCommission: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
});

// Compound index to ensure one record per user per week
AuxWeeklyPayrollSchema.index({ user: 1, weekStart: 1 }, { unique: true });

export const AuxWeeklyPayroll: Model<IAuxWeeklyPayroll> =
  mongoose.models.aux_weekly_payrolls || model('aux_weekly_payrolls', AuxWeeklyPayrollSchema);
