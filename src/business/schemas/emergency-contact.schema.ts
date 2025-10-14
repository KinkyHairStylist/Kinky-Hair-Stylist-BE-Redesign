import { Schema, model } from 'mongoose';

const EmergencyContactSchema = new Schema({


    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true},
    firstName: { type: String, required: true},
    lastName: { type: String, required: true},
    email: { type: String, required: true},
    relationship: { type: String, required: true},
    phone: { type: String, required: true},
    createdAt : { type: Date, default: Date.now},
    updatedAt: { type: Date, default: Date.now},
});




export const EmergencyContact = model('EmergencyContact', EmergencyContactSchema);