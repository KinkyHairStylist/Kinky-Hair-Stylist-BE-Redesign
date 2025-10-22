// src/membership/membership.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipTier, UserMembership } from './membership.entity';
import { User } from '../user/user.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MembershipTier)
    private tierRepository: Repository<MembershipTier>,
    @InjectRepository(UserMembership)
    private membershipRepository: Repository<UserMembership>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // Get all membership tiers
  async getMembershipTiers(): Promise<MembershipTier[]> {
    return this.tierRepository.find({ where: { isActive: true }, order: { price: 'ASC' } });
  }

  // Subscribe to membership
  async subscribeToMembership(userId: string, tierId: number): Promise<UserMembership> {
    const tier = await this.tierRepository.findOne({ where: { id: tierId, isActive: true } });
    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    // Cancel existing membership if exists
    const existingMembership = await this.membershipRepository.findOne({ 
      where: { userId, status: 'active' } 
    });
    if (existingMembership) {
      existingMembership.status = 'cancelled';
      existingMembership.cancelledAt = new Date();
      await this.membershipRepository.save(existingMembership);
    }

    // Create new membership
    const membership = this.membershipRepository.create({
      userId,
      tierId,
      monthlyCost: tier.price,
      status: 'active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      sessionsUsed: 0,
      totalSessions: this.getSessionsForTier(tier.name),
    });

    return this.membershipRepository.save(membership);
  }

  // Get user subscription
  async getUserSubscription(userId: string): Promise<UserMembership | null> {
    const membership = await this.membershipRepository.findOne({
      where: { userId },
      relations: ['tier'],
      order: { createdAt: 'DESC' }
    });
    return membership;
  }

  // Cancel membership
  async cancelMembership(userId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({ where: { userId, status: 'active' } });
    if (!membership) {
      throw new NotFoundException('Active membership not found');
    }

    membership.status = 'cancelled';
    membership.cancelledAt = new Date();
    await this.membershipRepository.save(membership);
  }

  // Upgrade membership
  async upgradeMembership(userId: string, newTierId: number): Promise<UserMembership> {
    const newTier = await this.tierRepository.findOne({ where: { id: newTierId, isActive: true } });
    if (!newTier) {
      throw new NotFoundException('New membership tier not found');
    }

    const currentMembership = await this.membershipRepository.findOne({ 
      where: { userId, status: 'active' },
      relations: ['tier']
    });
    if (!currentMembership) {
      throw new BadRequestException('No active membership to upgrade');
    }

    if (currentMembership.tierId === newTierId) {
      throw new BadRequestException('Already on this tier');
    }

    // Cancel current membership
    currentMembership.status = 'cancelled';
    currentMembership.cancelledAt = new Date();
    await this.membershipRepository.save(currentMembership);

    // Create upgraded membership
    const upgradedMembership = this.membershipRepository.create({
      userId,
      tierId: newTierId,
      monthlyCost: newTier.price,
      status: 'active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sessionsUsed: currentMembership.sessionsUsed,
      totalSessions: this.getSessionsForTier(newTier.name),
    });

    return this.membershipRepository.save(upgradedMembership);
  }

  // Helper method to determine sessions based on tier
  private getSessionsForTier(tierName: string): number {
    switch (tierName.toLowerCase()) {
      case 'basic':
        return 3;
      case 'monthly':
        return 5;
      case 'exclusive':
        return 10;
      default:
        return 3;
    }
  }

  // Seed initial membership tiers
  async seedMembershipTiers() {
    const tiers = [
      {
        name: 'Basic',
        price: 49.99,
        period: 'monthly',
        description: '3 months',
        features: [
          'Access to basic content',
          'Community support',
          'Monthly updates',
          'Email support',
          'Basic analytics'
        ],
        isPopular: false,
        originalPrice: null,
        isActive: true
      },
      {
        name: 'Monthly',
        price: 39.99,
        period: 'monthly',
        description: '1 month',
        features: [
          'Everything in Basic',
          'Premium content access',
          'Priority support',
          'Advanced features',
          'Weekly updates',
          'Custom integrations'
        ],
        isPopular: true,
        originalPrice: 59.99,
        isActive: true
      },
      {
        name: 'Exclusive',
        price: 149.99,
        period: 'yearly',
        description: '6 months',
        features: [
          'Everything in Monthly',
          'Exclusive content',
          'One-on-one sessions',
          '24/7 support',
          'Custom features',
          'Analytics dashboard',
          'API access'
        ],
        isPopular: false,
        originalPrice: null,
        isActive: true
      }
    ];

    for (const tier of tiers) {
      const existing = await this.tierRepository.findOne({ where: { name: tier.name } });
      if (!existing) {
        await this.tierRepository.save(tier as MembershipTier);
      }
    }
  }
}
