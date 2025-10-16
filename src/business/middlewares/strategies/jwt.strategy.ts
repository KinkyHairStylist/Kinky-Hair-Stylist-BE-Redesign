import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Add this import
import { Payload } from '../../types/constants';
import { AuthService } from '../../services/auth.service';

// REMOVE THIS: import dotenv from 'dotenv';
// REMOVE THIS: dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService, // Add ConfigService
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET'); // Use ConfigService

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set in environment variables.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: Payload) {
    const user = await this.authService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid.');
    }
    return user;
  }
}