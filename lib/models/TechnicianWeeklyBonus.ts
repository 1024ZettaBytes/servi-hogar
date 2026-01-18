import mongoose, { Schema } from 'mongoose';

const TechnicianWeeklyBonusSchema = new Schema(
  {
    technician: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    weekStart: {
      type: Date,
      required: true
    },
    weekEnd: {
      type: Date,
      required: true
    },
    punctualityBonus: {
      amount: {
        type: Number,
        default: 125
      },
      active: {
        type: Boolean,
        default: true
      }
    },
    repairBonus: {
      amount: {
        type: Number,
        default: 100
      },
      active: {
        type: Boolean,
        default: true
      },
      // Stores info about the calculation
      totalMaintenances: {
        type: Number,
        default: 0
      },
      completedMaintenances: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one record per technician per week
TechnicianWeeklyBonusSchema.index({ technician: 1, weekStart: 1 }, { unique: true });

export const TechnicianWeeklyBonus =
  mongoose.models.technician_weekly_bonuses ||
  mongoose.model('technician_weekly_bonuses', TechnicianWeeklyBonusSchema);
