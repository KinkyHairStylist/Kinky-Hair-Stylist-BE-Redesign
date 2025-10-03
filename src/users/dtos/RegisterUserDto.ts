import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsEnum,
  IsMobilePhone,
} from 'class-validator';
import { Gender } from '../types/types';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(8, 30, { message: 'Password must be between 8 and 30 characters.' })
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsMobilePhone(undefined, { strictMode: false })
  @IsNotEmpty()
  phoneNumber: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}
