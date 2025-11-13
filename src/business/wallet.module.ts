import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Transaction } from './entities/transaction.entity';
import { BusinessWalletController } from './controllers/wallet.controller';
import { UserModule } from 'src/user/modules/user.module';
import { BusinessWalletService } from './services/wallet.service';
import { Business } from './entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, PaymentMethod, Business]),
    UserModule,
  ],
  controllers: [BusinessWalletController],
  providers: [BusinessWalletService],
  exports: [BusinessWalletService],
})
export class BusinessWalletModule {}
