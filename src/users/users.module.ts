import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

// Schemas
import { User, UserSchema } from './schemas/user.schema';
import {
  OtpVerification,
  OtpVerificationSchema,
} from './schemas/otp.verification.schema';

// Services
import { AuthService } from './services/AuthService';
import { OtpService } from './services/OtpService';
import { EmailService } from './services/EmailService';
import { JwtAuthService } from './services/JwtService';

// Utils
import { PasswordUtil } from './utils/PasswordUtil';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { EmailVerificationController } from './controllers/email-verification.controller';

// Middleware & Guards
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpVerification.name, schema: OtpVerificationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-super-secret-jwt-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController, EmailVerificationController],
  providers: [
    AuthService,
    OtpService,
    EmailService,
    JwtAuthService,
    PasswordUtil,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService, OtpService, EmailService, JwtAuthService],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'email-verification/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
