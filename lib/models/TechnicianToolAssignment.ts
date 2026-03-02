import mongoose, { Document, Model, model, Schema } from 'mongoose';

export interface ITechnicianToolAssignment extends Document {
  technician: Schema.Types.ObjectId;
  tools: {
    tool: Schema.Types.ObjectId;
    quantity: number;
  }[];
  photoUrl: string;
  status: string;
  assignedBy: Schema.Types.ObjectId;
  assignedAt: Date;
  auxVerifiedBy: Schema.Types.ObjectId;
  auxVerifiedAt: Date;
  techConfirmedAt: Date;
  replacedTechnician: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianToolAssignmentSchema = new Schema<ITechnicianToolAssignment>({
  technician: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  tools: [
    {
      tool: {
        type: Schema.Types.ObjectId,
        ref: 'tools',
        required: true
      },
      quantity: {
        type: Number,
        default: 1
      }
    }
  ],
  photoUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING_AUX_VERIFICATION', 'PENDING_TECH_CONFIRMATION', 'CONFIRMED'],
    default: 'PENDING_AUX_VERIFICATION',
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  auxVerifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  auxVerifiedAt: {
    type: Date,
    default: null
  },
  techConfirmedAt: {
    type: Date,
    default: null
  },
  replacedTechnician: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
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

export const TechnicianToolAssignment: Model<ITechnicianToolAssignment> =
  mongoose.models.technician_tool_assignments ||
  model('technician_tool_assignments', TechnicianToolAssignmentSchema);
