import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CompanySize } from '../types/constants';
import { User } from './user.schema';

@Schema({ _id: false })
class BookingPolicies {
  @Prop({ required: true, min: 0 })
  minimumLeadTime: number; //minutes

  @Prop({ required: true, min: 0 })
  bufferTime: number; //minutes

  @Prop({ required: true, min: 0 })
  cancellationWindow: number; //hours

  @Prop({ default: 0 })
  depositAmount: number;
}

const BookingPoliciesSchema = SchemaFactory.createForClass(BookingPolicies);

@Schema({ _id: false })
class BookingDay {
  @Prop({ required: true })
  day:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';

  @Prop({ default: false })
  isOpen: boolean;

  @Prop({ required: '09:00' })
  startTime: string;

  @Prop({ required: '17:00' })
  endTime: string;
}

const BookingDaySchema = SchemaFactory.createForClass(BookingDay);

export type BusinessDocument = HydratedDocument<Business>;

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true, trim: true, lowercase: true })
  businessName: string;

  @Prop({ required: true, trim: true, lowercase: true })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ required: true, trim: true, lowercase: true })
  primaryAudience: string;

  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ required: true, trim: true })
  businessAddress: string;

  @Prop({ type: BookingPoliciesSchema, required: true })
  bookingPolicies: BookingPolicies;

  @Prop({ type: String, enum: CompanySize, required: true })
  companySize: CompanySize;

  @Prop({ type: [BookingDaySchema], required: true })
  bookingHours: BookingDay[];

  @Prop({ required: true, trim: true })
  howDidYouHear: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
