import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UserDocument } from '../types/types';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

@Injectable()
export class JwtAuthService {
  private readonly logger = new Logger(JwtAuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'your-super-secret-jwt-key';
    this.jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '1h';
    this.refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'your-refresh-token-secret';
    this.refreshTokenExpiresIn =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d';
  }

  /**
   * Generate access token for user
   */
  generateAccessToken(user: UserDocument): string {
    const payload: JwtPayload = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sub: user._id.toString(),
      email: user.email,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  /**
   * Generate refresh token for user
   */
  generateRefreshToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      type: 'refresh',
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(user: UserDocument): TokenResponse {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(this.jwtExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (error) {
      this.logger.error('Access token verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.refreshTokenSecret);
    } catch (error) {
      this.logger.error('Refresh token verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const timeValue = parseInt(expiresIn.slice(0, -1));
    const timeUnit = expiresIn.slice(-1);

    switch (timeUnit) {
      case 's':
        return timeValue;
      case 'm':
        return timeValue * 60;
      case 'h':
        return timeValue * 60 * 60;
      case 'd':
        return timeValue * 24 * 60 * 60;
      default:
        return 3600;
    }
  }
}
