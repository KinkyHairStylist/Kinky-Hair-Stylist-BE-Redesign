import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  otp: string | null;

  @Prop({ type: Date, default: null })
  otpExpiresAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
