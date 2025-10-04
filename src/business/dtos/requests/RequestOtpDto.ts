import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  readonly email: string;
}
