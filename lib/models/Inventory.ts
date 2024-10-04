import mongoose, { Model, model, Schema } from 'mongoose';

export interface IInventory extends Document {
  code: string;
  name: string;
  stock: number;
  min: number;
  price: number;
  sellPrice: number;
  latestCost: number;
  type: string;
  createdAt: Date;
}

const InventorySchema = new Schema<IInventory>({
  code: { type: String, required: true },
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  min: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  latestCost: { type: Number, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, required: true }
});

export const Inventory: Model<IInventory> =
  mongoose.models.inventories || model('inventories', InventorySchema);
