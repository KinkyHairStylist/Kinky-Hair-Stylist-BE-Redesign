import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OtpVerification } from '../schemas/otp.verification.schema';
import { OtpVerificationDocument } from '../types/types';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_LENGTH = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly MAX_RESEND_ATTEMPTS = 5;

  constructor(
    @InjectModel(OtpVerification.name)
    private otpVerificationModel: Model<OtpVerificationDocument>,
  ) {}

  /**
   * Generate a random numeric OTP
   */
  generateOtp(): string {
    return Math.floor(
      Math.pow(10, this.OTP_LENGTH - 1) +
        Math.random() * 9 * Math.pow(10, this.OTP_LENGTH - 1),
    ).toString();
  }

  /**
   * Calculate OTP expiry time
   */
  calculateOtpExpiry(): Date {
    return new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
  }

  /**
   * Check if OTP has expired
   */
  isOtpExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  /**
   * Create or update OTP verification for an email
   */
  async createOtpVerification(
    email: string,
    registrationData?: any,
  ): Promise<{ otp: string; expiresAt: Date }> {
    const existingOtp = await this.otpVerificationModel.findOne({ email });

    if (existingOtp && !this.isOtpExpired(existingOtp.otpExpiresAt)) {
      throw new BadRequestException(
        `OTP already sent to ${email}. Please wait for it to expire or request a new one after ${this.OTP_EXPIRY_MINUTES} minutes.`,
      );
    }

    const otp = this.generateOtp();
    const otpExpiresAt = this.calculateOtpExpiry();

    await this.otpVerificationModel.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        otpExpiresAt,
        isVerified: false,
        attempts: 0,
        registrationData,
        $inc: { resendAttempts: existingOtp ? 1 : 0 },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `OTP created for ${email}: ${otp} (expires: ${otpExpiresAt})`,
    );

    return { otp, expiresAt: otpExpiresAt };
  }

  /**
   * Verify OTP for email verification
   */
  async verifyOtp(
    email: string,
    inputOtp: string,
  ): Promise<{ success: boolean; message: string }> {
    const otpVerification = await this.otpVerificationModel.findOne({ email });

    if (!otpVerification) {
      throw new BadRequestException(
        'No OTP verification found for this email. Please request a new OTP.',
      );
    }

    // Check if already verified
    if (otpVerification.isVerified) {
      return { success: true, message: 'Email already verified' };
    }

    // Check if max attempts exceeded
    if (otpVerification.attempts >= this.MAX_ATTEMPTS) {
      await this.clearOtp(email);
      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    // Check if OTP expired
    if (this.isOtpExpired(otpVerification.otpExpiresAt)) {
      await this.clearOtp(email);
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    // Verify OTP
    if (otpVerification.otp !== inputOtp) {
      // Increment attempt counter
      await this.otpVerificationModel.findOneAndUpdate(
        { email },
        { $inc: { attempts: 1 } },
      );

      const attemptsLeft = this.MAX_ATTEMPTS - (otpVerification.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
      );
    }

    // OTP is valid - mark as verified
    await this.otpVerificationModel.findOneAndUpdate(
      { email },
      {
        isVerified: true,
        verifiedAt: new Date(),
      },
    );

    this.logger.log(`Email verified successfully for ${email}`);
    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Resend OTP with rate limiting
   */
  async resendOtp(email: string): Promise<{ otp: string; expiresAt: Date }> {
    const existingOtp = await this.otpVerificationModel.findOne({ email });

    // Check resend rate limiting
    if (existingOtp && existingOtp.resendAttempts >= this.MAX_RESEND_ATTEMPTS) {
      throw new BadRequestException(
        'Maximum resend attempts exceeded. Please try again later.',
      );
    }

    // Clear existing OTP and create new one
    await this.otpVerificationModel.deleteOne({ email });

    return this.createOtpVerification(email, existingOtp?.registrationData);
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const otpVerification = await this.otpVerificationModel.findOne({ email });
    return otpVerification?.isVerified || false;
  }

  /**
   * Get OTP verification data (for registration pre-fill)
   */
  async getOtpVerification(
    email: string,
  ): Promise<OtpVerificationDocument | null> {
    return this.otpVerificationModel.findOne({ email });
  }

  /**
   * Clear OTP data (after successful registration or expiry)
   */
  async clearOtp(email: string): Promise<void> {
    await this.otpVerificationModel.deleteOne({ email });
  }

  /**
   * Get OTP status
   */
  async getOtpStatus(email: string): Promise<{
    exists: boolean;
    isVerified: boolean;
    expiresAt?: Date;
    attempts: number;
    attemptsLeft: number;
    resendAttempts: number;
  }> {
    const otpVerification = await this.otpVerificationModel.findOne({ email });

    if (!otpVerification) {
      return {
        exists: false,
        isVerified: false,
        attempts: 0,
        attemptsLeft: this.MAX_ATTEMPTS,
        resendAttempts: 0,
      };
    }

    return {
      exists: true,
      isVerified: otpVerification.isVerified,
      expiresAt: otpVerification.otpExpiresAt,
      attempts: otpVerification.attempts,
      attemptsLeft: this.MAX_ATTEMPTS - otpVerification.attempts,
      resendAttempts: otpVerification.resendAttempts,
    };
  }

  /**
   * Clean up expired OTPs (can be called by a scheduled job)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpVerificationModel.deleteMany({
      otpExpiresAt: { $lt: new Date() },
      isVerified: false,
    });

    this.logger.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount;
  }
}
