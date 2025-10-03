import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../services/AuthService';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Verify JWT token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload: any = await this.jwtService.verifyAsync(token);
      // Get user from database
      const user = await this.authService.findById(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        payload.sub || payload.userId,
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      request.user = user;
      request.userId = user._id.toString();

      this.logger.log(`Access granted to user: ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}