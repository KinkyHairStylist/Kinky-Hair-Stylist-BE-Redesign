import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantMembershipPackage } from './entities/merchant-membership-package.entity';
import { MerchantMembershipPurchase } from './entities/merchant-membership-purchase.entity';
import { Service } from './entities/service.entity';
import { Business } from './entities/business.entity';
import { BusinessGiftCard } from './entities/business-giftcard.entity';
import { Transaction } from './entities/transaction.entity';
import { MerchantMembershipController } from './controllers/merchant-membership.controller';
import { MerchantMembershipService } from './services/merchant-membership.service';
import { PrepaidPoolExpiryCronService } from './services/prepaid-pool-expiry-cron.service';
import { BusinessWalletModule } from './wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantMembershipPackage,
      MerchantMembershipPurchase,
      Service,
      Business,
      BusinessGiftCard,
      Transaction,
    ]),
    BusinessWalletModule,
  ],
  controllers: [MerchantMembershipController],
  providers: [MerchantMembershipService, PrepaidPoolExpiryCronService],
  exports: [MerchantMembershipService],
})
export class MerchantMembershipModule {}
