import { Injectable, BadRequestException, NotFoundException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MembershipSubscription } from '../user_entities/membership-subscription.entity';
import { MembershipTier } from '../user_entities/membership-tier.entity';
import { SubscribeMembershipDto } from '../dtos/subscribe-membership.dto';
import { User } from '../../all_user_entities/user.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MembershipSubscription)
    private readonly subscriptionRepo: Repository<MembershipSubscription>,

    @InjectRepository(MembershipTier)
    private readonly tierRepo: Repository<MembershipTier>,
  ) {}

  async subscribe(user: User, dto: SubscribeMembershipDto) {
    const tier = await this.tierRepo.findOne({ where: { id: dto.tierId } });
    if (!tier) throw new BadRequestException('Invalid membership tier');

    const existing = await this.subscriptionRepo.findOne({
      where: { userId: user.id, status: 'active' },
    });

    if (existing) {
      throw new BadRequestException('You already have an active subscription');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + tier.durationDays);

    const subscription = this.subscriptionRepo.create({
      userId: user.id,
      tierId: tier.id,
      startDate,
      endDate,
      remainingSessions: tier.session,
      status: 'active',
    });

    await this.subscriptionRepo.save(subscription);

    return {
      message: `Subscribed successfully to ${tier.name}`,
      subscription,
      success: true,
    };
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionRepo.find({ where: { userId } });
  }

  // Get User Subscription
  async getUserSubscription(userId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: 'active' },
      relations: ['tier'],
    });

    if (!subscription) {
      throw new NotFoundException('No active membership found.');
    }

    return subscription;
  }

  // Cancel Membership
  async cancelMembership(userId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      throw new NotFoundException('No active membership found.');
    }

    subscription.status = 'cancelled';
    subscription.endDate = new Date();

    await this.subscriptionRepo.save(subscription);

    return { message: 'Membership cancelled successfully.' };
  }

  // Upgrade Membership
  async upgradeMembership(userId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: 'active' },
      relations: ['tier'],
    });

    if (!subscription) {
      throw new NotFoundException('No active membership found.');
    }

    const allTiers = await this.tierRepo.find({ order: { initialPrice: 'ASC' } });
    const currentIndex = allTiers.findIndex(t => t.id === subscription.tier.id);

    if (currentIndex === -1 || currentIndex === allTiers.length - 1) {
      throw new BadRequestException('You are already at the highest membership tier.');
    }

    const nextTier = allTiers[currentIndex + 1];
    subscription.tier = nextTier;
    subscription.tierId = nextTier.id;
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + nextTier.durationDays * 24 * 60 * 60 * 1000);

    await this.subscriptionRepo.save(subscription);

    return { message: `Successfully upgraded to ${nextTier.name} tier.` };
  }
}
