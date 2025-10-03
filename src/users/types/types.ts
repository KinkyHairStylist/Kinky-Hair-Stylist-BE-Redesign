import { Document } from 'mongoose';
import { User } from '../schemas/user.schema';
import { OtpVerification } from '../schemas/otp.verification.schema';

export type UserDocument = User & Document;
export type OtpVerificationDocument = OtpVerification & Document;
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  CUSTOM = 'CUSTOM',
}

export type UserWithoutPassword = {
  firstName: string;
  surname: string;
  email: string;
  phoneNumber: string;
  gender: Gender;
};
