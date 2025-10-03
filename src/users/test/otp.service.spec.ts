import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { OtpService } from '../services/OtpService';
import { OtpVerification } from '../schemas/otp.verification.schema';

describe('OtpService', () => {
  let service: OtpService;
  let model: jest.Mocked<Model<any>>;

  beforeEach(async () => {
    const mockModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getModelToken(OtpVerification.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    model = module.get(getModelToken(OtpVerification.name));
  });

  describe('generateOtp', () => {
    it('should generate a 5-digit OTP', () => {
      const otp = service.generateOtp();
      expect(otp).toHaveLength(5);
      expect(Number(otp)).toBeGreaterThanOrEqual(10000);
      expect(Number(otp)).toBeLessThanOrEqual(99999);
    });
  });

  describe('calculateOtpExpiry', () => {
    it('should calculate expiry time 10 minutes from now', () => {
      const now = Date.now();
      const expiry = service.calculateOtpExpiry();
      const expectedExpiry = now + 10 * 60 * 1000;

      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('isOtpExpired', () => {
    it('should return true for expired OTP', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(service.isOtpExpired(pastDate)).toBe(true);
    });

    it('should return false for valid OTP', () => {
      const futureDate = new Date(Date.now() + 1000);
      expect(service.isOtpExpired(futureDate)).toBe(false);
    });
  });

  describe('createOtpVerification', () => {
    it('should create new OTP verification successfully', async () => {
      const email = 'test@example.com';
      const registrationData = { firstName: 'John' };

      model.findOne.mockResolvedValue(null);
      model.findOneAndUpdate.mockResolvedValue({
        email,
        otp: '12345',
        otpExpiresAt: new Date(),
        isVerified: false,
        attempts: 0,
      });

      const result = await service.createOtpVerification(
        email,
        registrationData,
      );

      expect(result.otp).toHaveLength(5);
      expect(result.expiresAt).toBeInstanceOf(Date);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(model.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should throw BadRequestException if OTP already exists and not expired', async () => {
      const email = 'test@example.com';
      const futureDate = new Date(Date.now() + 5 * 60 * 1000);

      model.findOne.mockResolvedValue({
        email,
        otp: '12345',
        otpExpiresAt: futureDate,
        isVerified: false,
      });

      await expect(service.createOtpVerification(email)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const email = 'test@example.com';
      const otp = '12345';
      const futureDate = new Date(Date.now() + 5 * 60 * 1000);

      model.findOne.mockResolvedValue({
        email,
        otp,
        otpExpiresAt: futureDate,
        isVerified: false,
        attempts: 0,
      });

      model.findOneAndUpdate.mockResolvedValue({});

      const result = await service.verifyOtp(email, otp);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      const email = 'test@example.com';
      const otp = '12345';
      const wrongOtp = '54321';
      const futureDate = new Date(Date.now() + 5 * 60 * 1000);

      model.findOne.mockResolvedValue({
        email,
        otp,
        otpExpiresAt: futureDate,
        isVerified: false,
        attempts: 0,
      });

      await expect(service.verifyOtp(email, wrongOtp)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired OTP', async () => {
      const email = 'test@example.com';
      const otp = '12345';
      const pastDate = new Date(Date.now() - 5 * 60 * 1000);

      model.findOne.mockResolvedValue({
        email,
        otp,
        otpExpiresAt: pastDate,
        isVerified: false,
        attempts: 0,
      });

      model.deleteOne.mockResolvedValue({});

      await expect(service.verifyOtp(email, otp)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return success for already verified email', async () => {
      const email = 'test@example.com';
      const otp = '12345';

      model.findOne.mockResolvedValue({
        email,
        otp,
        isVerified: true,
      });

      const result = await service.verifyOtp(email, otp);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email already verified');
    });
  });

  describe('isEmailVerified', () => {
    it('should return true for verified email', async () => {
      const email = 'test@example.com';

      model.findOne.mockResolvedValue({
        email,
        isVerified: true,
      });

      const result = await service.isEmailVerified(email);
      expect(result).toBe(true);
    });

    it('should return false for unverified email', async () => {
      const email = 'test@example.com';

      model.findOne.mockResolvedValue({
        email,
        isVerified: false,
      });

      const result = await service.isEmailVerified(email);
      expect(result).toBe(false);
    });

    it('should return false when no OTP record exists', async () => {
      const email = 'test@example.com';

      model.findOne.mockResolvedValue(null);

      const result = await service.isEmailVerified(email);
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredOtps', () => {
    it('should clean up expired OTPs', async () => {
      model.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const result = await service.cleanupExpiredOtps();

      expect(result).toBe(5);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(model.deleteMany).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        otpExpiresAt: { $lt: expect.any(Date) },
        isVerified: false,
      });
    });
  });
});
