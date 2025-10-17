import { IsNotEmpty, IsPhoneNumber, Length } from 'class-validator';

export class VerifyPhoneOtpDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  @Length(4, 6)
  otp: string;
}
