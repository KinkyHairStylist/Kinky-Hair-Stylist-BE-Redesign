import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipTier } from '../user_entities/membership-tier.entity';

@Injectable()
export class MembershipTierService {
  constructor(
    @InjectRepository(MembershipTier)
    private readonly membershipRepo: Repository<MembershipTier>,
  ) {}

  async getAllTiers() {
    return await this.membershipRepo.find({ order: { availablePrice: 'ASC' } });
  }

  async seedDefaultTiers() {
    const count = await this.membershipRepo.count();
    if (count === 0) {
        const tiers = [
        {
            name: 'Basic Care',
            description: 'Bronze.',
            initialPrice: 69.99,
            availablePrice: 49.99,
            durationDays: 30,
            session: 2,
        },
        {
            name: 'Premium Hair Care',
            description: 'Gold',
            initialPrice: 109.99,
            availablePrice: 89.99,
            durationDays: 30,
            session: 4,
            isRecommended: true,
        },
        {
            name: 'Luxury Experience',
            description: 'Platinum',
            initialPrice: 209.99,
            availablePrice: 149.99,
            durationDays: 30,
            session: 6,
        },
        ];

        await this.membershipRepo.save(tiers);
    }
  }
}