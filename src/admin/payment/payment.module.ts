import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Business } from 'src/business/entities/business.entity';
import { BusinessWalletModule } from 'src/business/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Business]),
    BusinessWalletModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
