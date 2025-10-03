import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/AuthService';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { PasswordUtil } from '../utils/PasswordUtil';
import { User } from '../schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let passwordUtil: PasswordUtil;

  beforeEach(async () => {
    userModel = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    userModel.findOne = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    userModel.findById = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    passwordUtil = {
      hashPassword: jest.fn(),
      validatePasswordStrength: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: PasswordUtil, useValue: passwordUtil },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      phoneNumber: '1234567890',
      firstName: 'John',
      surname: 'Doe',
      gender: 'male',
    };

    it('should register a new user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      userModel.findOne.mockResolvedValue(null);
      passwordUtil.hashPassword = jest.fn().mockResolvedValue('hashed123');

      const saveMock = jest.fn().mockResolvedValue({
        ...dto,
        password: 'hashed123',
        isVerified: true,
        toObject: () => ({ ...dto, password: 'hashed123', isVerified: true }),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      userModel.mockImplementation(() => ({ save: saveMock }));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.register(dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(passwordUtil.validatePasswordStrength).toHaveBeenCalledWith(
        dto.password,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(result).toMatchObject({
        email: dto.email,
        firstName: dto.firstName,
        surname: dto.surname,
        phoneNumber: dto.phoneNumber,
        gender: dto.gender,
        isVerified: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((result as any).password).toBeUndefined();
    });

    it('should throw if email already exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      userModel.findOne.mockResolvedValue({ email: dto.email });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.register(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw if phone number already exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      userModel.findOne.mockResolvedValue({ phoneNumber: dto.phoneNumber });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.register(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = { email: 'test@example.com', password: 'hashed' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(user),
      });

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(user);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = { id: 'abc123', email: 'test@example.com' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const result = await service.findById('abc123');
      expect(result).toEqual(user);
    });
  });
});
