import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, length: 6 })
  otp: string;

  @Prop({ required: true, expires: '900s' })
  expiresAt: Date;

  @Prop({ default: 0, min: 0 })
  trials: number;

  @Prop({ default: 5, min: 0 })
  maxTrials: number;
}

export const EmailVerificationSchema =
  SchemaFactory.createForClass(EmailVerification);

EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
