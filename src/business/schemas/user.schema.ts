import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender } from '../types/constants';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  phone: string;

  @Prop({ type: String, enum: {}, required: true })
  gender: Gender;

  @Prop({ default: false })
  isVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
