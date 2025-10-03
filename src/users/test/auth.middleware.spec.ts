import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { AuthService } from '../services/AuthService';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let jwtService: jest.Mocked<JwtService>;
  let authService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const mockAuthService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
    jwtService = module.get(JwtService);
    authService = module.get(AuthService);

    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('use', () => {
    it('should throw UnauthorizedException when no token provided', async () => {
      mockRequest.headers = {};

      await expect(
        middleware.use(
          mockRequest as any,
          mockResponse as Response,
          nextFunction,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        middleware.use(
          mockRequest as any,
          mockResponse as Response,
          nextFunction,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const mockPayload = {
        sub: 'nonexistent-user',
        email: 'test@example.com',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      authService.findById.mockResolvedValue(null);

      await expect(
        middleware.use(
          mockRequest as any,
          mockResponse as Response,
          nextFunction,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user email not verified', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isVerified: false,
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      authService.findById.mockResolvedValue(mockUser as any);

      await expect(
        middleware.use(
          mockRequest as any,
          mockResponse as Response,
          nextFunction,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await expect(
        middleware.use(
          mockRequest as any,
          mockResponse as Response,
          nextFunction,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle JWT specific errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      const jwtError = new Error('Token expired');
      jwtError.name = 'TokenExpiredError';
      jwtService.verifyAsync.mockRejectedValue(jwtError);

      await expect(
        middleware.use(
          mockRequest as any,
          mockResponse as Response,
          nextFunction,
        ),
      ).rejects.toThrow('Token has expired');

      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
