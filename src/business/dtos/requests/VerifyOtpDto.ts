import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  readonly email: string;

  @IsString({ message: 'OTP must be a string.' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  @IsNotEmpty({ message: 'OTP is required.' })
  readonly otp: string;
}
