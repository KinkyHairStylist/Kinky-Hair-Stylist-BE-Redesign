import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token must be a string.' })
  @IsNotEmpty({ message: 'Reset token is required' })
  readonly token: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password too weak: must include uppercase, lowercase, number, and symbol.',
    },
  )
  readonly newPassword: string;
}
