import mongoose, { Model, model, Schema } from 'mongoose';

export interface IVehicle extends Document {
  description: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  machinesOn: [Schema.Types.ObjectId];
  city: Schema.Types.ObjectId;
}

const VehicleSchema = new Schema<IVehicle>({
  description: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true },
  color: { type: String, required: true },
  machinesOn: { type: [Schema.Types.ObjectId], default: [] },
  city: { type: Schema.Types.ObjectId, ref: 'cities', required: true }
});

export const Vehicle: Model<IVehicle> =
  mongoose.models.vehicles || model('vehicles', VehicleSchema);
