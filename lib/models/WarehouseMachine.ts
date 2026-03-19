import mongoose, { Model, model, Schema } from 'mongoose';

export interface IWarehouseMachine extends Document {
  entryNumber: number;
  origin: string;
  brand: string;
  serialNumber: string;
  cost: number;
  status: string;
  entryPhotos: [String];
  conditioningPhotos: [String];
  currentWarehouse: Schema.Types.ObjectId;
  currentVehicle: Schema.Types.ObjectId;
  fromMachine: Schema.Types.ObjectId;
  resultingMachine: Schema.Types.ObjectId;
  resultingSalesMachine: Schema.Types.ObjectId;
  purchasedBy: Schema.Types.ObjectId;
  assignedTechnician: Schema.Types.ObjectId;
  techAssignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: Schema.Types.ObjectId;
  active: boolean;
}

const WarehouseMachineSchema = new Schema<IWarehouseMachine>({
  entryNumber: { type: Number, required: true },
  origin: {
    type: String,
    enum: ['NUEVA', 'REPUESTA', 'COMPRA_CALLE'],
    required: true
  },
  brand: { type: String, required: true },
  serialNumber: { type: String, default: '' },
  cost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: [
      'ALMACENADA',
      'EN_VEHICULO',
      'EN_ACONDICIONAMIENTO',
      'ACONDICIONADA',
      'DESMANTELADA',
      'ASIGNADA_RENTA',
      'CONVERTIDA_VENTA'
    ],
    default: 'ALMACENADA'
  },
  entryPhotos: { type: [String], default: [] },
  conditioningPhotos: { type: [String], default: [] },
  currentWarehouse: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'warehouses'
  },
  currentVehicle: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'vehicles'
  },
  fromMachine: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'machines'
  },
  resultingMachine: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'machines'
  },
  resultingSalesMachine: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'sales_machines'
  },
  purchasedBy: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'users'
  },
  assignedTechnician: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'users'
  },
  techAssignedAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastUpdatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
  active: { type: 'boolean', default: true }
});

export const WarehouseMachine: Model<IWarehouseMachine> =
  mongoose.models.warehouse_machines || model('warehouse_machines', WarehouseMachineSchema);
