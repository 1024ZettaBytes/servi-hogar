import mongoose, { Model, model, Schema } from 'mongoose';

export interface IWareHouse extends Document {
  name: string;
  city: Schema.Types.ObjectId;
  maps: string;
}

const WarehouseSchema = new Schema<IWareHouse>({
  name: { type: String, required: true },
  city: { type: Schema.Types.ObjectId, ref:'cities', required: true},
  maps: { type: String, required: true },
});

export const Warehouse: Model<IWareHouse> =
  mongoose.models.warehouses ||
  model('warehouses', WarehouseSchema);
