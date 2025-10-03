import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../services/AuthService';
import { UserDocument } from '../types/types';

export interface AuthenticatedRequest extends Request {
  user?: UserDocument;
  userId?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = this.extractTokenFromHeader(req);

      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.verifyToken(token);

      // Get user from database to ensure user still exists and is active
      const user = await this.authService.findById(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
        payload.sub || payload.userId,
      );

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      // Attach user information to request object
      req.user = user;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req.userId = user._id.toString();

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.log(`User authenticated: ${user.email} (ID: ${user._id})`);

      next();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Authentication failed:', error.message);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle JWT specific errors
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }

  /**
   * Verify JWT token and return payload
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Token verification failed:', error.message);
      throw error;
    }
  }
}
