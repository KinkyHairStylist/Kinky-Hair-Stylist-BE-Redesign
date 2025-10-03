import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../guards/auth.guard';
import { AuthService } from '../services/AuthService';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let authService: jest.Mocked<AuthService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const mockAuthService = {
      findById: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService);
    authService = module.get(AuthService);
    reflector = module.get(Reflector);
  });

  const createMockExecutionContext = (headers: any = {}): ExecutionContext => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true); // Route is public

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should allow access with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isVerified: true,
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
      };

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      reflector.getAllAndOverride.mockReturnValue(false); // Route is protected
      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      authService.findById.mockResolvedValue(mockUser as any);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.findById).toHaveBeenCalledWith('user123');
    });

    it('should deny access when no token provided', async () => {
      const context = createMockExecutionContext({});
      reflector.getAllAndOverride.mockReturnValue(false); // Route is protected

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should deny access when token is invalid', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer invalid-token',
      });

      reflector.getAllAndOverride.mockReturnValue(false); // Route is protected
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should deny access when user not found', async () => {
      const mockPayload = {
        sub: 'nonexistent-user',
        email: 'test@example.com',
      };

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      reflector.getAllAndOverride.mockReturnValue(false); // Route is protected
      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      authService.findById.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should deny access when user email not verified', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isVerified: false,
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
      };

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      reflector.getAllAndOverride.mockReturnValue(false); // Route is protected
      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      authService.findById.mockResolvedValue(mockUser as any);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle JWT token expiration', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer expired-token',
      });

      reflector.getAllAndOverride.mockReturnValue(false); // Route is protected

      const jwtError = new Error('Token expired');
      jwtError.name = 'TokenExpiredError';
      jwtService.verifyAsync.mockRejectedValue(jwtError);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token has expired',
      );
    });
  });
});
