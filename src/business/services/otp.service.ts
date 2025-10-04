import {
  BadRequestException,
  Injectable,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  EmailVerification,
  EmailVerificationDocument,
} from '../schemas/email.verification.schema';
import { IEmailService } from './emailService/interfaces/i.email.service';
import { AuthService } from './auth.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly EXPIRATION_MINUTES = 15;
  private readonly MAX_TRIALS = 5;

  constructor(
    @InjectModel(EmailVerification.name)
    private otpModel: Model<EmailVerificationDocument>,
    private readonly emailService: IEmailService,
    private readonly userService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generates, saves, and sends a new OTP for the given email (User does not exist yet).
   * @param email The email to verify.
   */
  async requestOtp(email: string): Promise<void> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser && existingUser.isVerified) {
      throw new ConflictException(
        'This email is already registered and verified.',
      );
    }

    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRATION_MINUTES);

    await this.otpModel.findOneAndUpdate(
      { email },
      {
        otp,
        expiresAt,
        trials: 0,
        maxTrials: this.MAX_TRIALS,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
    this.logger.debug(`OTP generated for email ${email}: ${otp}`);

    await this.emailService.sendOtp(email, otp);
  }

  /**
   * Verifies the OTP and issues a short-lived Verification Token (JWT).
   * This token proves the email is valid and is required for the final registration step.
   * @param email The email being verified.
   * @param providedOtp The OTP entered by the user.
   */
  async verifyOtp(
    email: string,
    providedOtp: string,
  ): Promise<{ verificationToken: string }> {
    const otpDocument = await this.otpModel.findOne({ email });

    if (!otpDocument) {
      throw new BadRequestException(
        'Verification required. Please request a new OTP.',
      );
    }

    if (otpDocument.trials >= otpDocument.maxTrials) {
      await this.otpModel.deleteOne({ email });
      throw new ConflictException(
        'Maximum verification attempts reached. Please request a new OTP.',
      );
    }

    if (otpDocument.otp !== providedOtp) {
      otpDocument.trials += 1;
      await otpDocument.save();
      throw new BadRequestException('Invalid OTP provided.');
    }

    if (new Date() > otpDocument.expiresAt) {
      await this.otpModel.deleteOne({ email });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    await this.otpModel.deleteOne({ email });

    const verificationToken = await this.jwtService.signAsync(
      { email },
      {
        secret: process.env.JWT_VERIFICATION_SECRET,
        expiresIn: '5m',
      },
    );

    this.logger.log(
      `Email ${email} successfully verified. Verification token issued.`,
    );
    return { verificationToken };
  }

  /**
   * Simple 6-digit number generation.
   */
  private generateOtp(): string {
    return Math.floor(
      Math.pow(10, this.OTP_LENGTH - 1) +
        Math.random() * 9 * Math.pow(10, this.OTP_LENGTH - 1),
    ).toString();
  }
}
