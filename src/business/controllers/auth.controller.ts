import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { OtpService } from '../services/otp.service';
import { RequestOtpDto } from '../dtos/requests/RequestOtpDto';
import { VerifyOtpDto } from '../dtos/requests/VerifyOtpDto';
import { LoginDto } from '../dtos/requests/LoginDto';
import { RefreshTokenDto } from '../dtos/requests/RefreshTokenDto';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';

// interface RequestWithUser extends Request {
//   user: any;
// }

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    await this.otpService.requestOtp(email);

    return {
      message: 'OTP successfully requested and sent to your email.',
      email: email,
    };
  }

  @Post('otp/verify')
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

  @Post('otp/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto);
  }
}
