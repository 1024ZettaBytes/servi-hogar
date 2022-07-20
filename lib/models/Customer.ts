import mongoose, { Model, model, Schema } from 'mongoose';

export interface ICustomer extends Document {
  curp: string;
  name: string;
  cell: string;
  street: string;
  suburb: string;
  city: string;
  redidenceRef: string;
  nameRef: string;
  telRef: string;
  maps: string;
}

const CustomerSchema: Schema = new Schema({
  curp: { type: 'string' },
  name: { type: 'string' },
  cell: { type: 'string' },
  street: { type: 'string' },
  suburb: { type: 'string' },
  city: { type: 'string' },
  residenceRef: { type: 'string' },
  nameRef: { type: 'string' },
  telRef: { type: 'string' },
  maps: { type: 'string' }
});
export const Customer: Model<ICustomer> =
  mongoose.models.Customer || model('Customer', CustomerSchema);
