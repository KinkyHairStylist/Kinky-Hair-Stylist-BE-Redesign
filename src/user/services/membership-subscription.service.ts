import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  // Subscribe to a new membership tier
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

    const nextBillingDate = new Date(startDate);
    nextBillingDate.setDate(startDate.getDate() + 30); // Assuming monthly billing cycle

    const subscription = this.subscriptionRepo.create({
      userId: user.id,
      tierId: tier.id,
      startDate,
      endDate,
      remainingSessions: tier.session,
      status: 'active',
      nextBillingDate,
      monthlyCost: tier.initialPrice, // Assuming this column stores monthly fee
    });

    await this.subscriptionRepo.save(subscription);

    return {
      message: `Subscribed successfully to ${tier.name}`,
      subscription,
      success: true,
    };
  }

  // Get all subscriptions for a user
  async getUserSubscriptions(userId: string) {
    return this.subscriptionRepo.find({ where: { userId } });
  }

  // Get active subscription for a user
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

  // Cancel active membership
  async cancelMembership(userId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      throw new NotFoundException('No active membership found.');
    }

    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    subscription.cancelledAt = new Date(); // Record cancellation timestamp

    await this.subscriptionRepo.save(subscription);

    return { message: 'Membership cancelled successfully.' };
  }

  // Upgrade membership to next available tier
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

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + nextTier.durationDays * 24 * 60 * 60 * 1000);

    const nextBillingDate = new Date(startDate);
    nextBillingDate.setDate(startDate.getDate() + 30);

    subscription.tier = nextTier;
    subscription.tierId = nextTier.id;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.remainingSessions = nextTier.session;
    subscription.monthlyCost = nextTier.initialPrice;
    subscription.nextBillingDate = nextBillingDate;

    await this.subscriptionRepo.save(subscription);

    return { message: `Successfully upgraded to ${nextTier.name} tier.` };
  }
}
