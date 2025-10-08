// src/user/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  surname: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  gender: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationCode: string; // For signup

  @Prop()
  verificationExpires: Date; // For signup

  // 👇 NEW: For password reset
  @Prop()
  resetCode: string;

  @Prop()
  resetCodeExpires: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
