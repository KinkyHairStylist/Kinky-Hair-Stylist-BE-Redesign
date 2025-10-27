import { BadRequestException, Body, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { OtpService } from '../services/otp.service';
import { RequestOtpDto } from '../dtos/requests/RequestOtpDto';
import { VerifyOtpDto } from '../dtos/requests/VerifyOtpDto';
import { LoginDto } from '../dtos/requests/LoginDto';
import { RefreshTokenDto } from '../dtos/requests/RefreshTokenDto';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';
import { ResetPasswordDto } from '../dtos/requests/ResetPasswordDto';
import { VerifyPasswordOtpDto } from '../dtos/requests/VerifyPasswordOtpDto';
import { VerifyResetTokenDto } from '../dtos/requests/VerifyResetTokenDto';
import { RequestPhoneOtpDto } from '../dtos/requests/RequestPhoneOtpDto';
import { VerifyPhoneOtpDto } from '../dtos/requests/VerifyPhoneOtpDto';

// interface RequestWithUser extends Request {
//   user: any;
// }

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('/business/register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.register(createUserDto);
  }

  @Post('/business/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('/business/forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto);
  }

  @Post('/business/verify-password-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordOtp(@Body() verifyPasswordOtpDto: VerifyPasswordOtpDto) {
    return this.authService.verifyPasswordOtp(verifyPasswordOtpDto);
  }

  @Post('/business/verify-reset-token')
  @HttpCode(HttpStatus.OK)
  async verifyResetToken(@Body() verifyResetTokenDto: VerifyResetTokenDto) {
    return this.authService.verifyResetToken(verifyResetTokenDto);
  }

  @Post('/business/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }


  @Post('/business/otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    await this.otpService.requestOtp(email);

    return {
      message: 'OTP successfully requested and sent to your email.',
      email: email,
    };
  }

  @Post('/business/otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const { verificationToken } = await this.otpService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );

    return {
      message: 'Email successfully verified! Proceed to final registration.',
      verificationToken,
    };
  }

  @Post('/business/otp/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('/business/request-phone-otp')
  @HttpCode(HttpStatus.OK)
  async requestPhoneOtp(@Body() requestPhoneOtpDto: RequestPhoneOtpDto) {
    return this.authService.requestPhoneOtp(requestPhoneOtpDto);
  }

  @Post('/business/verify-phone-number')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneNumber(@Body() verifyPhoneOtpDto: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneNumber(verifyPhoneOtpDto);
  }
}
