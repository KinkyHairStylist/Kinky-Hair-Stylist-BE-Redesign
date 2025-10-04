import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtil } from '../utils/password.util';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import mongoose from 'mongoose';
import { Gender } from '../types/constants';

const mockUserId = new mongoose.Types.ObjectId();
const mockHashedPassword = 'hashedPassword123';
const mockAccessToken = 'mock_access_token';
const mockRefreshToken = 'mock_refresh_token';
const mockVerificationToken = 'mock_verification_token';

const mockCreateUserDto: CreateUserDto = {
  email: 'test@example.com',
  firstname: 'Test',
  surname: 'User',
  password: 'StrongPassword123!',
  phone: '1234567890',
  gender: Gender.CUSTOM,
  verificationToken: mockVerificationToken,
};

// Mock User Document instance (returned by 'new UserModel().save()')
const mockUserDocumentInstance = {
  _id: mockUserId,
  email: mockCreateUserDto.email,
  phone: mockCreateUserDto.phone,
  password: mockHashedPassword,
  save: jest.fn().mockResolvedValue({
    _id: mockUserId,
    email: mockCreateUserDto.email,
    password: mockHashedPassword,
  } as UserDocument),
} as unknown as UserDocument;

// --- MOCK DEPENDENCIES ---

// 1. Mock PasswordUtil
const mockPasswordUtil = {
  hashPassword: jest.fn().mockResolvedValue(mockHashedPassword),
  validatePasswordStrength: jest.fn(), // Should not throw for success case
  comparePassword: jest.fn(),
};

// 2. Mock JwtService
const mockJwtService = {
  signAsync: jest.fn((payload, options) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (options.expiresIn === '15m') {
      return Promise.resolve(mockAccessToken);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (options.expiresIn === '7d') {
      return Promise.resolve(mockRefreshToken);
    }
    return Promise.resolve('unknown_token');
  }),
  verifyAsync: jest.fn().mockResolvedValue({ email: mockCreateUserDto.email }),
};

// 3. Mock Mongoose User Model (Constructor and statics/queries)
const mockUserModel = jest.fn().mockImplementation((dto) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...mockUserDocumentInstance,
    ...dto,
  };
}) as unknown as Model<UserDocument>;

(mockUserModel as jest.Mock & typeof mockUserModel).findOne = jest.fn();
(mockUserModel as jest.Mock & typeof mockUserModel).findById = jest
  .fn()
  .mockReturnValue({ exec: jest.fn() });
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(mockUserModel as jest.Mock & typeof mockUserModel).prototype.save =
  // eslint-disable-next-line @typescript-eslint/unbound-method
  mockUserDocumentInstance.save;

describe('AuthService', () => {
  let service: AuthService;
  let model: Model<UserDocument>;
  let userModelConstructor: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PasswordUtil, useValue: mockPasswordUtil },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
    userModelConstructor = model as unknown as jest.Mock;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- REGISTRATION TESTS ---
  describe('register', () => {
    it('should successfully register a new user and return tokens', async () => {
      (model.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.register(mockCreateUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(model.findOne).toHaveBeenCalledWith({
        $or: [
          { email: mockCreateUserDto.email },
          { phone: mockCreateUserDto.phone },
        ],
      });
      expect(mockPasswordUtil.validatePasswordStrength).toHaveBeenCalledWith(
        mockCreateUserDto.password,
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        mockVerificationToken,
        { secret: process.env.JWT_VERIFICATION_SECRET },
      );
      expect(mockPasswordUtil.hashPassword).toHaveBeenCalledWith(
        mockCreateUserDto.password,
      );
      expect(userModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockCreateUserDto.email,
          password: mockHashedPassword,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockUserDocumentInstance.save).toHaveBeenCalledTimes(1);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
    });

    it('should throw ConflictException if user email already exists', async () => {
      (model.findOne as jest.Mock).mockResolvedValue({
        email: mockCreateUserDto.email,
        phone: '9999999999',
      });

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if user phone already exists', async () => {
      (model.findOne as jest.Mock).mockResolvedValue({
        email: 'different@mail.com',
        phone: mockCreateUserDto.phone,
      });

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw UnauthorizedException if verification token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('invalid token'),
      );
      (model.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if password strength validation fails', async () => {
      (model.findOne as jest.Mock).mockResolvedValue(null);
      mockPasswordUtil.validatePasswordStrength.mockImplementation(() => {
        throw new Error('Weak password');
      });

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        'Weak password',
      );
      expect(mockPasswordUtil.hashPassword).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockUserDocumentInstance.save).not.toHaveBeenCalled();
    });
  });

  // --- FINDER METHODS TESTS ---
  describe('findOneById', () => {
    it('should call model.findById with the correct ID', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockUserDocumentInstance);
      (model.findById as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await service.findOneById(mockUserId.toString());

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(model.findById).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockUserDocumentInstance);
    });
  });

  describe('getTokens', () => {
    it('should return access and refresh tokens', async () => {
      const tokens = await service.getTokens(
        mockUserId.toString(),
        mockCreateUserDto.email,
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUserId.toString(), email: mockCreateUserDto.email },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUserId.toString(), email: mockCreateUserDto.email },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
      );

      expect(tokens).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });
  });
});
