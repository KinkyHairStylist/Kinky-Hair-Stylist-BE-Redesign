import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class RequestPhoneOtpDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;
}
