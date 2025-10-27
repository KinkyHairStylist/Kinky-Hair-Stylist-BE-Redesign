import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from './email/email.module';
import { BusinessModule } from './business/business.module';
import { AdminModule } from './admin/admin.module';
import { GiftcardModule } from './admin/giftcard/giftcard.module';
import { PaymentModule } from './admin/payment/payment.module';
import { TransactionFeeModule } from './admin/transaction-fee/transaction-fee.module';
import { WithdrawalModule } from './admin/withdrawal/withdrawal.module';
import { WalletModule } from './admin/wallet/wallet.module';

import { UserModule } from './user/user.module';
import { SalonModule } from './user/salon/salon.module';
import { BookingModule } from './user/salon/booking/booking.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { SeedsModule } from './user/salon/seeds/seed.module';
import { typeOrmConfig } from './config/database';

// import { ModerationModule } from './admin/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    EmailModule,
    BusinessModule,
    AdminModule,
    GiftcardModule,
    PaymentModule,
    TransactionFeeModule,
    WithdrawalModule,
    WalletModule,

    UserModule,
    SalonModule,
    SeedsModule,
    BookingModule,

    // ModerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
