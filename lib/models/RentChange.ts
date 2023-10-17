import mongoose, { Model, model, Schema } from 'mongoose';

export interface IRentChange extends Document {
  totalNumber: number;
  dayNumber: number;
  rent: Schema.Types.ObjectId;
  status: string;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  wasFixed: boolean;
  problemDesc: string;
  solutionDesc: string;
  changedAccesories: object;
  pickedMachine: Schema.Types.ObjectId;
  leftMachine: Schema.Types.ObjectId;
  imagesUrl: object;
  date: Date,
  timeOption: string;
  reason: string;
  cancellationReason: string;
  fromTime: Date,
  endTime:Date,
  wasSent: boolean;
  finishedAt: Date;
  operator: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const RentChangeSchema = new Schema<IRentChange>({
  totalNumber: { type: Schema.Types.Number, required: true },
  dayNumber: { type: Schema.Types.Number, required: true },
  rent: {
    type: Schema.Types.ObjectId,
    ref: 'rents',
    required: true
  },
  status: { type: String, default: 'ESPERA' },
  takenAt: { type: Date, default: null },
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'operators',
    default: null
  },
  wasFixed: { type: 'boolean', default: false},
  pickedMachine: { type: Schema.Types.ObjectId, default: null, ref: 'machines' },
  leftMachine: { type: Schema.Types.ObjectId, default: null, ref: 'machines' },
  problemDesc: { type: String, default: null },
  solutionDesc: { type: String, default: null },
  changedAccesories: {type: Object, default: {}},
  imagesUrl:{ 
    type: Object,
    default:null
  },
  date: { type: Date, required: true },
  timeOption: { type: String, required:true },
  fromTime: { type: Date, required: true },
  endTime:{ type: Date, required: true },
  wasSent:{ type: Boolean, default: false },
  reason: { type: String, required: true },
  cancellationReason: { type: String, default: '' },
  finishedAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  operator: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const RentChange: Model<IRentChange> =
  mongoose.models.rent_changes ||
  model('rent_changes', RentChangeSchema);
