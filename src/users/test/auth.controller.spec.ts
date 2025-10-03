import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/AuthService';
import { ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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

    it('should call AuthService.register and return result', async () => {
      const mockUser = { ...dto, isVerified: true };
      (authService.register as jest.Mock).mockResolvedValue(mockUser);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.register(dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });

    it('should throw if AuthService.register throws', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new ConflictException('User already exists'),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(controller.register(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
