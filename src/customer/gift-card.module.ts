import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCardService } from './services/gift-card.service';
import { PaymentService } from './services/payment.service';
import { GiftCard } from './data/model/gift-card.entity';
import { GiftCardTemplate } from './data/model/gift-card-template.entity';
import { GiftCardsController } from './controller/gift-card.controller';
import { GiftCardTemplateRepository } from './data/repository/gift-card-template.repository';
import { GiftCardRepository } from './data/repository/gift-card.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GiftCard, GiftCardTemplate]),
  ],
  controllers: [GiftCardsController],
  providers: [
    GiftCardService,
    PaymentService,
    GiftCardRepository,
    GiftCardTemplateRepository,
  ],
  exports: [GiftCardService],
})
export class GiftCardModule {}