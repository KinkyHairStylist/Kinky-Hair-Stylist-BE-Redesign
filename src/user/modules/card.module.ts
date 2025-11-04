import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../../all_user_entities/card.entity';
import { CardService } from '../services/card.service';
import { CardController } from '../controllers/card.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Card])],
  providers: [CardService],
  controllers: [CardController],
  exports: [CardService],
})
export class CardModule {}
