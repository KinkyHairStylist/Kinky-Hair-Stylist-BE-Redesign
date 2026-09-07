import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessGiftCard } from './entities/business-giftcard.entity';
import { BusinessGiftCardsController } from './controllers/business-giftcard.controller';
import { BusinessGiftCardsService } from './services/business-giftcard.service';
import { Business } from './entities/business.entity';
import { Transaction } from './entities/transaction.entity';
import { PlatformSettingsEntity } from '../admin/platform-settings/entities/platform-settings.entity';
import { PlatformSettingsService } from '../admin/platform-settings/platform-settings.service';
import { BusinessWalletModule } from './wallet.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessGiftCard, Business, Transaction, PlatformSettingsEntity]),
    BusinessWalletModule,
  ],
  controllers: [BusinessGiftCardsController],
  providers: [BusinessGiftCardsService, PlatformSettingsService],
  exports: [BusinessGiftCardsService],
})
export class BusinessGiftCardsModule {}
