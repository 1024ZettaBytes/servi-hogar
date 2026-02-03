import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface IAuxPayrollConfig extends Document {
  user: Schema.Types.ObjectId;
  baseSalary: number;
  baseSalaryDescription: string;
  punctualityBonusAmount: number;
  restDayDeductionAmount: number;
  hireDate: Date;
  vacationDaysPerYear: number;
  vacationDaysUsed: number;
  collectionBonusEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AuxPayrollConfigSchema = new Schema<IAuxPayrollConfig>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true
  },
  baseSalary: {
    type: Number,
    required: true,
    default: 0
  },
  baseSalaryDescription: {
    type: String,
    default: 'SUELDO BASE'
  },
  punctualityBonusAmount: {
    type: Number,
    default: 0
  },
  restDayDeductionAmount: {
    type: Number,
    default: 0
  },
  hireDate: {
    type: Date,
    required: true
  },
  vacationDaysPerYear: {
    type: Number,
    default: 0
  },
  vacationDaysUsed: {
    type: Number,
    default: 0
  },
  collectionBonusEnabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const AuxPayrollConfig: Model<IAuxPayrollConfig> =
  mongoose.models.aux_payroll_configs || model('aux_payroll_configs', AuxPayrollConfigSchema);
