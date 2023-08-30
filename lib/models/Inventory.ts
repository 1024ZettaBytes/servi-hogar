import mongoose, { Model, model, Schema } from 'mongoose';

export interface IInventory extends Document {
  id: string;
  name: string;
  amount: number;
  type: string;
}

const InventorySchema = new Schema<IInventory>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true }
});

export const Inventory: Model<IInventory> =
  mongoose.models.inventories || model('inventories', InventorySchema);
