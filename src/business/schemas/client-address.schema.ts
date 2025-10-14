
import { Schema, model } from 'mongoose';

export const ClientAddressSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  addressName: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  location: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String, default: 'Australia' },
  isPrimary: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ClientAddressSchema.index({ clientId: 1 });

export const ClientAddressModel = model('ClientAddress', ClientAddressSchema);