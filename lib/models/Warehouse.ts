import mongoose, { Model, model, Schema } from 'mongoose';

export interface IWareHouse extends Document {
  name: string;
  city: Schema.Types.ObjectId;
  maps: string;
  isOffice: boolean;
}

const WarehouseSchema = new Schema<IWareHouse>({
  name: { type: String, required: true },
  city: { type: Schema.Types.ObjectId, ref:'cities', required: true},
  maps: { type: String, required: true },
  isOffice: { type: Boolean, default: false }
});

export const Warehouse: Model<IWareHouse> =
  mongoose.models.warehouses ||
  model('warehouses', WarehouseSchema);
