import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Card } from 'src/all_user_entities/card.entity';
import { GiftCard } from 'src/all_user_entities/gift-card.entity';
import { GiftCardController } from '../controllers/gift-card.controller';
import { GiftCardService } from '../services/gift-card.service';
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
        TypeOrmModule.forFeature([User, Referral, GiftCard, Card]),
        JwtModule.register({}),
        EmailModule,
        ReferralModule,
        PhoneVerificationModule,
    ],
    controllers: [UserController, GiftCardController],
    providers: [
        UserService,
        JwtRefreshStrategy,
        GiftCardService
    ],
    exports: [UserService],
})

export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EmailValidationMiddleware).forRoutes(UserController);
  }
}
