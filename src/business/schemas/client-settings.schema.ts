import { Schema, model} from 'mongoose';

export const ClientSettingsSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, unique: true},
    emailNotifications: { type: Boolean, default: true},
    smsNotifications: { type: Boolean, default: true},
    marketingEmails: { type: Boolean, default: false},
    clientType:{ type: String, enum: ['regular', 'vip', 'new'], default: 'regular'},
    notes: { type: String},
    preferences:{
        preferredContactMethod: { type: String, enum: ['email', 'sms', 'phone'], default: 'email'},
        language: {type: String, default: 'en'},
        timezone: { type: String, default:'Australia/Sydney'}
    },

    createdAt: { type: Date, default: Date.now},
    updatedAt: { type: Date, default: Date.now},
});

export const ClientSettingsModel = model('ClientSettings', ClientSettingsSchema);
