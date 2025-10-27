import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipTier } from '../user_entities/membership-tier.entity';
import { MembershipSubscription } from '../user_entities/membership-subscription.entity';
import { MembershipTierService } from '../services/membership-tier.service';
import { MembershipService } from '../services/membership-subscription.service';
import { MembershipTierController } from './membership-tier.controller';
import { MembershipSubscriptionController } from './membership-subscription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipTier, MembershipSubscription])],
  controllers: [MembershipTierController, MembershipSubscriptionController],
  providers: [MembershipTierService, MembershipService],
  exports: [MembershipTierService, MembershipService],
})
export class MembershipModule implements OnModuleInit {
  constructor(private readonly membershipTierService: MembershipTierService) {}

  // Seed default membership tiers automatically at startup
  async onModuleInit() {
    await this.membershipTierService.seedDefaultTiers();
  }
}
