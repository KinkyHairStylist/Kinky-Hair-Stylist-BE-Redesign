import { Injectable } from '@nestjs/common';
import { MembershipService } from '../membership.service';

@Injectable()
export class MembershipSeed {
  constructor(private readonly membershipService: MembershipService) {}

  async run() {
    console.log('Seeding membership tiers...');
    await this.membershipService.seedMembershipTiers();
    console.log('Membership tiers seeded successfully.');
  }
}
