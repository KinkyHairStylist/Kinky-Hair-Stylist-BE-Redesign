// src/user/user.dto.ts

import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

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
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// 👇 NEW: Password Reset DTOs
export class ResetPasswordStartDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResetPasswordFinishDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
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
  success:boolean
}
