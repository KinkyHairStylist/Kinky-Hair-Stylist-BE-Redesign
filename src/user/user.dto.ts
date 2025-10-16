import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Column } from 'typeorm';

export class GetStartedDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResendCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @Column({ nullable: true, default: false })
  isPhoneVerified?: boolean;
}

export class AuthResponseDto {
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    surname?: string;
    phoneNumber?: string;
    gender?: string;
    isVerified: boolean;
  };
}