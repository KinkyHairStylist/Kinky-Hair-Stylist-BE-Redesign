import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  // @Prop({ required: true })
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
  verificationCode: string;

  @Prop()
  verificationExpires: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
