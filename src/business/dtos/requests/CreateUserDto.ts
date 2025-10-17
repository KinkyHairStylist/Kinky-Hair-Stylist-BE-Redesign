import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Gender } from '../../types/constants';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  readonly email: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  readonly firstname: string;

  @IsString()
  @IsNotEmpty({ message: 'Surname is required.' })
  readonly surname: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsNotEmpty({ message: 'Password is required.' })
  readonly password: string;

  @IsPhoneNumber(undefined, { message: 'Please enter a valid phone number.' })
  @IsNotEmpty({ message: 'Phone number is required.' })
  readonly phone: string;

  @IsEnum(Gender, {
      message: 'Gender must be one of the following: MALE, FEMALE, CUSTOM.',
    })
  @IsNotEmpty({ message: 'Gender is required.' })
  gender: string;

  @IsString({ message: 'Verification token must be a string.' })
  @IsNotEmpty({
    message: 'Verification token is required to complete registration.',
  })
  readonly verificationToken: string;
}
