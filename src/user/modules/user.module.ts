import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Referral } from '../user_entities/referrals.entity';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../../all_user_entities/user.entity';
import { EmailValidationMiddleware } from '../../middleware/email-validation.middleware';
import { JwtRefreshStrategy } from '../../middleware/strategy/jwt-refresh.strategy';
import { EmailModule } from '../../email/email.module';
import { ReferralModule } from './referral.module';
import { PhoneVerificationModule } from './phone-verification.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Referral]),
        JwtModule.register({}),
        EmailModule,
        ReferralModule,
        PhoneVerificationModule,
    ],
    controllers: [UserController],
    providers: [
        UserService,
        JwtRefreshStrategy,
    ],
    exports: [UserService],
})

export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EmailValidationMiddleware).forRoutes(UserController);
  }
}
