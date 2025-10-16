import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PasswordUtil } from './utils/password.util';
import { JwtStrategy } from './middlewares/strategies/jwt.strategy';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { EmailModule } from './services/emailService/email.module';
import { OtpService } from './services/otp.service';

// Import entities
import { UserEntity } from './entities/user.entity';
import { BusinessEntity } from './entities/business.entity';
import { EmailVerificationEntity } from './entities/email-verification.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

@Module({
  imports: [
    PassportModule, // ✅ This should be a separate import
    TypeOrmModule.forFeature([
      UserEntity,
      BusinessEntity,
      EmailVerificationEntity,
      RefreshTokenEntity,
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