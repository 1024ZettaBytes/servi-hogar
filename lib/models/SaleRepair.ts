import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISaleRepair extends Document {
  totalNumber: number;
  salePickup: Schema.Types.ObjectId;
  machine: Schema.Types.ObjectId;
  usedInventory: [Schema.Types.ObjectId];
  status: string; // PENDIENTE, COMPLETADA, CANCELADA
  description: string;
  takenAt: Date;
  takenBy: Schema.Types.ObjectId;
  cancellationReason: string;
  finishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const SaleRepairSchema = new Schema<ISaleRepair>({
  totalNumber: { type: Schema.Types.Number, required: true },
  salePickup: {
    type: Schema.Types.ObjectId,
    ref: 'sale_pickups',
    required: true
  },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'sales_machines',
    required: true
  },
  usedInventory: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: 'used_inventory'
  },
  status: {
    type: String,
    enum: ['PENDIENTE', 'COMPLETADA', 'CANCELADA'],
    default: 'PENDIENTE'
  },
  description: { type: String, default: null },
  takenAt: { type: Date, required: true },
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  cancellationReason: { type: String, default: '' },
  finishedAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const SaleRepair: Model<ISaleRepair> =
  mongoose.models.sale_repairs || model('sale_repairs', SaleRepairSchema);
