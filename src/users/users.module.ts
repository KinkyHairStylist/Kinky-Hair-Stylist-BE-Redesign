import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import {
  OtpVerification,
  OtpVerificationSchema,
} from './schemas/otp.verification.schema';
import { AuthService } from './services/AuthService';
import { OtpService } from './services/OtpService';
import { EmailService } from './services/EmailService';
import { PasswordUtil } from './utils/PasswordUtil';
import { AuthController } from './controllers/auth.controller';
import { EmailVerificationController } from './controllers/email-verification.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpVerification.name, schema: OtpVerificationSchema },
    ]),
  ],
  controllers: [AuthController, EmailVerificationController],
  providers: [AuthService, OtpService, EmailService, PasswordUtil],
  exports: [AuthService, OtpService, EmailService],
})
export class UsersModule {}
