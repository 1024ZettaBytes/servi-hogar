import mongoose, { Model, model, Schema } from 'mongoose';

export interface ISalesMachine extends Document {
  machineNum: number;
  brand: string;
  capacity: string;
  cost: number;
  serialNumber: string;
  imageUrl: String;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
  evidencesUrls: [String];
  photosUrls: [String];
  active: boolean;
  isSold: boolean;
  status: string;
}

const SalesMachineSchema = new Schema<ISalesMachine>({
  machineNum: { type: Number, required: true },
  brand: { type: String, required: true },
  capacity: { type: String },
  cost: { type: Number, required: true },
  serialNumber: { type: String, default: '' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  evidencesUrls: { type: [String], default: [] },
  photosUrls: { type: [String], default: [] },
  active: { type: 'boolean', default: true },
  isSold: { type: 'boolean', default: false },
  status: {
    type: String,
    enum: ['DISPONIBLE', 'PENDIENTE', 'VENDIDO'],
    default: 'DISPONIBLE'
  }
});

export const SalesMachine: Model<ISalesMachine> =
  mongoose.models.sales_machines || model('sales_machines', SalesMachineSchema);
