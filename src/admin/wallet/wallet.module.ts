import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Payment } from '../payment/entities/payment.entity';
import { Withdrawal } from '../withdrawal/entities/withdrawal.entity';
import { GiftCard } from '../../all_user_entities/gift-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Withdrawal, GiftCard])],
  providers: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
