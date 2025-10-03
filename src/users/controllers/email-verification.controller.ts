import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { OtpService } from '../services/OtpService';
import { EmailService } from '../services/EmailService';
import { VerifyEmailDto } from '../dtos/VerifyEmailDto';

export class SendOtpDto {
  email: string;
  firstName?: string;
}

export class ResendOtpDto {
  email: string;
}

@Controller('email-verification')
export class EmailVerificationController {
  constructor(
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send OTP to email for verification
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    try {
      const { email, firstName } = sendOtpDto;

      if (!email) {
        throw new BadRequestException('Email is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Create OTP verification
      const { otp, expiresAt } = await this.otpService.createOtpVerification(
        email,
        { firstName },
      );

      // Send verification email
      const emailSent = await this.emailService.sendVerificationEmail(email, {
        otp,
        firstName,
        expiryMinutes: 10,
      });

      if (!emailSent) {
        throw new BadRequestException('Failed to send verification email');
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        data: {
          email,
          expiresAt,
          expiryMinutes: 10,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to send OTP');
    }
  }

  /**
   * Verify OTP for email verification
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyEmailDto: VerifyEmailDto) {
    try {
      const { email, otp } = verifyEmailDto;

      const result = await this.otpService.verifyOtp(email, otp);

      if (result.success) {
        await this.emailService.sendWelcomeEmail(email);
      }

      return {
        success: result.success,
        message: result.message,
        data: {
          email,
          isVerified: result.success,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify OTP');
    }
  }

  /**
   * Resend OTP to email
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    try {
      const { email } = resendOtpDto;

      if (!email) {
        throw new BadRequestException('Email is required');
      }

      // Get existing OTP data for firstName
      const existingOtp = await this.otpService.getOtpVerification(email);
      const firstName = existingOtp?.registrationData?.firstName;

      // Resend OTP
      const { otp, expiresAt } = await this.otpService.resendOtp(email);

      // Send verification email
      const emailSent = await this.emailService.sendVerificationEmail(email, {
        otp,
        firstName,
        expiryMinutes: 10,
      });

      if (!emailSent) {
        throw new BadRequestException('Failed to resend verification email');
      }

      return {
        success: true,
        message: 'OTP resent successfully',
        data: {
          email,
          expiresAt,
          expiryMinutes: 10,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to resend OTP');
    }
  }

  /**
   * Check OTP status for an email
   */
  @Get('status/:email')
  async getOtpStatus(@Param('email') email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const status = await this.otpService.getOtpStatus(email);

      return {
        success: true,
        message: 'OTP status retrieved successfully',
        data: {
          email,
          ...status,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get OTP status');
    }
  }

  /**
   * Check if email is verified
   */
  @Get('check-verification/:email')
  async checkEmailVerification(@Param('email') email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const isVerified = await this.otpService.isEmailVerified(email);

      return {
        success: true,
        message: 'Email verification status retrieved',
        data: {
          email,
          isVerified,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException('Failed to check email verification');
    }
  }
}
