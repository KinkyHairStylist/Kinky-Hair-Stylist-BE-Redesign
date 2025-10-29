import { IsNotEmpty, IsPhoneNumber, Length } from 'class-validator';

export class VerifyPhoneOtpDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  @Length(4, 6)
  otp: string;
}
