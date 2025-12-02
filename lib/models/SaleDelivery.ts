import mongoose, { Model, model, Schema, Document } from 'mongoose';

export interface ISaleDelivery extends Document {
  sale: Schema.Types.ObjectId;
  saleRepair: Schema.Types.ObjectId; // Optional: if this delivery is for a repaired machine
  isRepairReturn: boolean; // true if this is a repair return delivery
  status: string; // PENDIENTE, ASIGNADA, COMPLETADA, CANCELADA
  assignedAt: Date;
  assignedTo: Schema.Types.ObjectId;
  assignedBy: Schema.Types.ObjectId;
  deliveryDate: Date;
  completedAt: Date;
  completedBy: Schema.Types.ObjectId;
  imagesUrl: {
    ine: string;
    frontal: string;
    label: string;
    board: string;
  };
  customerDataUpdated: boolean;
  updatedCustomerData: object;
  cancellationReason: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const SaleDeliverySchema = new Schema<ISaleDelivery>({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'sales',
    required: true
  },
  saleRepair: {
    type: Schema.Types.ObjectId,
    ref: 'sale_repairs',
    default: null
  },
  isRepairReturn: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['PENDIENTE', 'ASIGNADA', 'COMPLETADA', 'CANCELADA'],
    default: 'PENDIENTE'
  },
  assignedAt: { type: Date, default: null },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  deliveryDate: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  imagesUrl: {
    type: {
      ine: { type: String, default: '' },
      frontal: { type: String, default: '' },
      label: { type: String, default: '' },
      board: { type: String, default: '' }
    },
    default: null
  },
  customerDataUpdated: { type: Boolean, default: false },
  updatedCustomerData: { type: Object, default: null },
  cancellationReason: { type: String, default: '' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' }
});

export const SaleDelivery: Model<ISaleDelivery> =
  mongoose.models.sale_deliveries ||
  model('sale_deliveries', SaleDeliverySchema);
