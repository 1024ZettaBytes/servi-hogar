import mongoose, { Model, model, Schema } from 'mongoose';

export interface IUsedInventory extends Document {
  mantainance: Schema.Types.ObjectId;
  inventoryProduct: Schema.Types.ObjectId;
  qty: number;
  price: number;
  date: Date;
  createdBy: Schema.Types.ObjectId;
}

const UsedInventorySchema = new Schema<IUsedInventory>({
  mantainance: {
    type: Schema.Types.ObjectId,
    ref: 'mantainances',
    required: true
  },
  inventoryProduct: {
    type: Schema.Types.ObjectId,
    ref: 'inventories',
    required: true
  },
  qty: { type: Schema.Types.Number, required: true },
  price: { type: Schema.Types.Number, required: true },
  date: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, default: null, ref: 'users' }
});

export const UsedInventory: Model<IUsedInventory> =
  mongoose.models.used_inventory ||
  model('used_inventory', UsedInventorySchema);
