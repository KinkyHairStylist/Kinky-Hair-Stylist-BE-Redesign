import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'otp_verifications' })
export class OtpVerification extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  otpExpiresAt: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: 0 })
  resendAttempts: number;

  @Prop()
  verifiedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const OtpVerificationSchema =
  SchemaFactory.createForClass(OtpVerification);
