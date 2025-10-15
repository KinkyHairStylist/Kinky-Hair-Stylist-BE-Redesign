
import { Schema, model } from 'mongoose';

export const ClientSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  pronouns: { type: String, enum: ['he-him', 'she-her', 'they-them', 'other'] },
  occupation: { type: String },
  clientSource: { 
    type: String, 
    enum: ['walk-in', 'referral', 'instagram', 'website', 'facebook', 'other'],
    default: 'walk-in'
  },
  profileImage: { type: String },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ClientSchema.index({ email: 1, businessId: 1 }, { unique: true });
ClientSchema.index({ ownerId: 1 });
ClientSchema.index({ businessId: 1 });

ClientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ClientModel = model('Client', ClientSchema);