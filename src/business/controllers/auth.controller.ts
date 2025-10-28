import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { OtpService } from '../services/otp.service';
import { RequestOtpDto } from '../dtos/requests/RequestOtpDto';
import { VerifyOtpDto } from '../dtos/requests/VerifyOtpDto';
import { LoginDto } from '../dtos/requests/LoginDto';
import { RefreshTokenDto } from '../dtos/requests/RefreshTokenDto';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';
import { ResetPasswordDto } from '../dtos/requests/ResetPasswordDto';
import { RequestPhoneOtpDto } from '../dtos/requests/RequestPhoneOtpDto';
import { VerifyPhoneOtpDto } from '../dtos/requests/VerifyPhoneOtpDto';

@Controller('auth')
export class AuthController {
  constructor(
      private readonly authService: AuthService,
      private readonly otpService: OtpService,
  ) {}


  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }


  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {

    return this.authService.requestPasswordReset(forgotPasswordDto);
  }

  @Post('verify-password-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    // Verifies OTP
    return this.authService.verifyPasswordOtp(verifyOtpDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    // Sets new password
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    await this.otpService.requestOtp(requestOtpDto.email);
    return { message: 'OTP sent to your email.', email: requestOtpDto.email };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }


  @Post('otp/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }


  @Post('request-phone-otp')
  @HttpCode(HttpStatus.OK)
  async requestPhoneOtp(@Body() requestPhoneOtpDto: RequestPhoneOtpDto) {
    return this.authService.requestPhoneOtp(requestPhoneOtpDto);
  }

  @Post('verify-phone-number')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneNumber(@Body() verifyPhoneOtpDto: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneNumber(verifyPhoneOtpDto);
  }
}
