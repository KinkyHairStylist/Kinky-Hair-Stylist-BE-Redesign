import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/business/entities/wallet.entity';
import { Transaction } from 'src/business/entities/transaction.entity';
import { PaymentMethod } from 'src/business/entities/payment-method.entity';
import { BusinessWalletModule } from 'src/business/wallet.module';
import { WebhookController } from './controller/webhook.controller';
import { WebhookService } from './services/webhook.service';
import { PaymentModule } from 'src/admin/payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, PaymentMethod]),
    BusinessWalletModule,
    PaymentModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
