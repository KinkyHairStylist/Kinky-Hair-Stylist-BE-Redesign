import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Card } from 'src/all_user_entities/card.entity';
import { GiftCard } from 'src/all_user_entities/gift-card.entity';
import { Article } from 'src/all_user_entities/article.entity';
import { SupportTicket } from 'src/all_user_entities/support-ticket.entity';
import { LiveChatMessage } from 'src/all_user_entities/live-chat-message.entity';
import { ArticleController } from '../controllers/article.controller';
import { TicketController } from '../controllers/ticket.controller';
import { GiftCardController } from '../controllers/gift-card.controller';
import { GiftCardService } from '../services/gift-card.service';
import { ArticleService } from '../services/article.service';
import { TicketService } from '../services/ticket.service';
import { Referral } from '../user_entities/referrals.entity';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../../all_user_entities/user.entity';
import { EmailValidationMiddleware } from '../../middleware/email-validation.middleware';
import { JwtRefreshStrategy } from '../../middleware/strategy/jwt-refresh.strategy';
import { EmailModule } from '../../email/email.module';
import { ReferralModule } from './referral.module';
import { PhoneVerificationModule } from './phone-verification.module';
import { UserProfileController } from '../controllers/user-profile.controller';
import { UserProfileService } from '../services/user-profile.service';
import { CloudinaryModule } from './cloudinary.module';
import { PreferencesModule } from './preferences.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Referral, GiftCard, Card, Article, SupportTicket, LiveChatMessage]),
        JwtModule.register({}),
        EmailModule,
        ReferralModule,
        PhoneVerificationModule,
        CloudinaryModule,
        PreferencesModule,
    ],
    controllers: [UserController, GiftCardController, ArticleController, TicketController, UserProfileController],
    providers: [
        UserService,
        JwtRefreshStrategy,
        GiftCardService,
        ArticleService,
        TicketService,
        UserProfileService
    ],
    exports: [UserService],
})

export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EmailValidationMiddleware).forRoutes(UserController);
  }
}
