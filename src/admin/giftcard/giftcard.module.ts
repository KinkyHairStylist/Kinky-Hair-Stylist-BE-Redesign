import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftcardService } from './giftcard.service';
import { GiftcardController } from './giftcard.controller';
import { GiftCard } from '../../all_user_entities/gift-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard])],
  controllers: [GiftcardController],
  providers: [GiftcardService],
   exports: [GiftcardService, TypeOrmModule],
  
})
export class GiftcardModule {}
