import mongoose, { Date, Model, model, Schema } from 'mongoose';

export interface IResidence extends Document {
  street: string;
  suburb: string;
  city: Schema.Types.ObjectId;
  sector: Schema.Types.ObjectId;
  residenceRef: string;
  nameRef: string;
  telRef: string;
  maps: string;
  coordinates: Object;
  createdAt: Date;
  updatedAt: Date;
}

const ResidenceSchema = new Schema<IResidence>({
  street: { type: 'string', required: true},
  suburb: { type: 'string', required: true},
  city: {
    type: Schema.Types.ObjectId,
    ref:'cities',
    required: true
  },
  sector: {
    type: Schema.Types.ObjectId,
    ref:'sectors',
    required: true
  },
  residenceRef: { type: 'string', required: true},
  nameRef: { type: 'string', required: true},
  telRef: { type: 'string', required: true},
  maps: { type: 'string', required: true},
  coordinates: {type: Object, required: true},
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true }
});
export const Residence: Model<IResidence> =
  mongoose.models.residences || model('residences', ResidenceSchema);
