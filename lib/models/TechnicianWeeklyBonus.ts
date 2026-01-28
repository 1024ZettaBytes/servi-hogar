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
    // Only manual bonuses are stored in the database
    // Automatic bonuses (repair, noFailures) are calculated in real-time in the report
    punctualityBonus: {
      amount: {
        type: Number,
        default: 125
      },
      active: {
        type: Boolean,
        default: true
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
