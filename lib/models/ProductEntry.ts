import mongoose, { Model, model, Schema } from 'mongoose';

export interface IProductEntry extends Document {
  product: Schema.Types.ObjectId;
  qty: number;
  cost: number;
  date: Date;
  createdAt: Date;
}

const ProductEntrySchema = new Schema<IProductEntry>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'inventories',
    required: true
  },
  qty: { type: Number, required: true },
  cost: { type: Number, required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, required: true }
});

export const ProductEntry: Model<IProductEntry> =
  mongoose.models.product_entries ||
  model('product_entries', ProductEntrySchema);
