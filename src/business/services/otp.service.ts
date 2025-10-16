import {
  BadRequestException,
  Injectable,
  Logger,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { IEmailService } from './emailService/interfaces/i.email.service';
import { AuthService } from './auth.service';
import { EmailVerificationEntity } from '../entities/email-verification.entity';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 5;
  private readonly EXPIRATION_MINUTES = 15;
  private readonly MAX_TRIALS = 5;

  constructor(
    @InjectRepository(EmailVerificationEntity)
    private otpRepository: Repository<EmailVerificationEntity>,
    private readonly emailService: IEmailService,
    @Inject(forwardRef(() => AuthService))
    private readonly userService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtpForPasswordReset(email: string): Promise<void> {
    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRATION_MINUTES);

    await this.otpRepository.upsert(
      {
        email,
        otp,
        expiresAt,
        trials: 0,
        maxTrials: this.MAX_TRIALS,
      },
      ['email'],
    );

    this.logger.debug(`OTP generated for email ${email}: ${otp}`);
    await this.emailService.sendOtp(email, otp);
  }

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

    await this.otpRepository.upsert(
      {
        email,
        otp,
        expiresAt,
        trials: 0,
        maxTrials: this.MAX_TRIALS,
      },
      ['email'],
    );

    this.logger.debug(`OTP generated for email ${email}: ${otp}`);
    await this.emailService.sendOtp(email, otp);
  }

  async verifyOtp(
    email: string,
    providedOtp: string,
  ): Promise<{ verificationToken: string }> {
    const otpDocument = await this.otpRepository.findOne({
      where: { email },
    });

    if (!otpDocument) {
      throw new BadRequestException(
        'Verification required. Please request a new OTP.',
      );
    }

    if (otpDocument.trials >= otpDocument.maxTrials) {
      await this.otpRepository.delete({ email });
      throw new ConflictException(
        'Maximum verification attempts reached. Please request a new OTP.',
      );
    }

    if (otpDocument.otp !== providedOtp) {
      otpDocument.trials += 1;
      await this.otpRepository.save(otpDocument);
      throw new BadRequestException('Invalid OTP provided.');
    }

    if (new Date() > otpDocument.expiresAt) {
      await this.otpRepository.delete({ email });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    await this.otpRepository.delete({ email });

    const verificationToken = await this.jwtService.signAsync(
      { email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '5m',
      },
    );

    this.logger.log(
      `Email ${email} successfully verified. Verification token issued.`,
    );
    return { verificationToken };
  }

  async deleteOtp(email: string): Promise<void> {
    await this.otpRepository.delete({ email });
  }

  private generateOtp(): string {
    return Math.floor(
      Math.pow(10, this.OTP_LENGTH - 1) +
        Math.random() * 9 * Math.pow(10, this.OTP_LENGTH - 1),
    ).toString();
  }
}