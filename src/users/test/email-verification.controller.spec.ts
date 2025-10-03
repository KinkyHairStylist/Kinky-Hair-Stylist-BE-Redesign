import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmailVerificationController } from '../controllers/email-verification.controller';
import { OtpService } from '../services/OtpService';
import { EmailService } from '../services/EmailService';

describe('EmailVerificationController', () => {
  let controller: EmailVerificationController;
  let otpService: jest.Mocked<OtpService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockOtpService = {
      createOtpVerification: jest.fn(),
      verifyOtp: jest.fn(),
      resendOtp: jest.fn(),
      getOtpStatus: jest.fn(),
      isEmailVerified: jest.fn(),
      getOtpVerification: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailVerificationController],
      providers: [
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<EmailVerificationController>(
      EmailVerificationController,
    );
    otpService = module.get(OtpService);
    emailService = module.get(EmailService);
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const sendOtpDto = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const mockOtpData = {
        otp: '12345',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      otpService.createOtpVerification.mockResolvedValue(mockOtpData);
      emailService.sendVerificationEmail.mockResolvedValue(true);

      const result = await controller.sendOtp(sendOtpDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(result.data.email).toBe(sendOtpDto.email);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(otpService.createOtpVerification).toHaveBeenCalledWith(
        sendOtpDto.email,
        { firstName: sendOtpDto.firstName },
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        sendOtpDto.email,
        {
          otp: mockOtpData.otp,
          firstName: sendOtpDto.firstName,
          expiryMinutes: 10,
        },
      );
    });

    it('should throw BadRequestException for invalid email', async () => {
      const sendOtpDto = {
        email: 'invalid-email',
        firstName: 'John',
      };

      await expect(controller.sendOtp(sendOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when email is missing', async () => {
      const sendOtpDto = {
        email: '',
        firstName: 'John',
      };

      await expect(controller.sendOtp(sendOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when email sending fails', async () => {
      const sendOtpDto = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const mockOtpData = {
        otp: '12345',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      otpService.createOtpVerification.mockResolvedValue(mockOtpData);
      emailService.sendVerificationEmail.mockResolvedValue(false);

      await expect(controller.sendOtp(sendOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const verifyEmailDto = {
        email: 'test@example.com',
        otp: '12345',
      };

      const mockVerifyResult = {
        success: true,
        message: 'Email verified successfully',
      };

      otpService.verifyOtp.mockResolvedValue(mockVerifyResult);
      emailService.sendWelcomeEmail.mockResolvedValue(true);

      const result = await controller.verifyOtp(verifyEmailDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockVerifyResult.message);
      expect(result.data.email).toBe(verifyEmailDto.email);
      expect(result.data.isVerified).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        verifyEmailDto.email,
        verifyEmailDto.otp,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        verifyEmailDto.email,
      );
    });

    it('should handle invalid OTP', async () => {
      const verifyEmailDto = {
        email: 'test@example.com',
        otp: '54321',
      };

      otpService.verifyOtp.mockRejectedValue(
        new BadRequestException('Invalid OTP'),
      );

      await expect(controller.verifyOtp(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      const resendOtpDto = {
        email: 'test@example.com',
      };

      const mockExistingOtp = {
        registrationData: { firstName: 'John' },
      };

      const mockOtpData = {
        otp: '54321',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      otpService.getOtpVerification.mockResolvedValue(mockExistingOtp as any);
      otpService.resendOtp.mockResolvedValue(mockOtpData);
      emailService.sendVerificationEmail.mockResolvedValue(true);

      const result = await controller.resendOtp(resendOtpDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP resent successfully');
      expect(result.data.email).toBe(resendOtpDto.email);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(otpService.resendOtp).toHaveBeenCalledWith(resendOtpDto.email);
    });

    it('should throw BadRequestException when email is missing', async () => {
      const resendOtpDto = {
        email: '',
      };

      await expect(controller.resendOtp(resendOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getOtpStatus', () => {
    it('should get OTP status successfully', async () => {
      const email = 'test@example.com';
      const mockStatus = {
        exists: true,
        isVerified: false,
        expiresAt: new Date(),
        attempts: 1,
        attemptsLeft: 2,
        resendAttempts: 0,
      };

      otpService.getOtpStatus.mockResolvedValue(mockStatus);

      const result = await controller.getOtpStatus(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP status retrieved successfully');
      expect(result.data.email).toBe(email);
      expect(result.data.exists).toBe(mockStatus.exists);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(otpService.getOtpStatus).toHaveBeenCalledWith(email);
    });

    it('should throw BadRequestException when email is missing', async () => {
      await expect(controller.getOtpStatus('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkEmailVerification', () => {
    it('should check email verification successfully', async () => {
      const email = 'test@example.com';
      otpService.isEmailVerified.mockResolvedValue(true);

      const result = await controller.checkEmailVerification(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verification status retrieved');
      expect(result.data.email).toBe(email);
      expect(result.data.isVerified).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(otpService.isEmailVerified).toHaveBeenCalledWith(email);
    });

    it('should throw BadRequestException when email is missing', async () => {
      await expect(controller.checkEmailVerification('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
