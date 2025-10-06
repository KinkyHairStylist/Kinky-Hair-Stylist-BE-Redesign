import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PasswordUtil } from './utils/password.util';
import { JwtStrategy } from './middlewares/strategies/jwt.strategy';
import { BusinessService } from './services/business.service';
import { Business, BusinessSchema } from './schemas/business.schema';
import { BusinessController } from './controllers/business.controller';
import { EmailModule } from './services/emailService/email.module';
import { OtpService } from './services/otp.service';
import {
  EmailVerification,
  EmailVerificationSchema,
} from './schemas/email.verification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
    JwtModule.register({}),
    EmailModule,
    forwardRef(() => BusinessModule),
  ],
  controllers: [AuthController, BusinessController],
  providers: [
    AuthService,
    PasswordUtil,
    JwtStrategy,
    BusinessService,
    OtpService,
  ],
  exports: [AuthService, BusinessService, OtpService],
})
export class BusinessModule {}
