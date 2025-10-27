// src/membership/seeds/seed-membership.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MembershipService } from '../membership.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  try {
    const membershipService = app.get(MembershipService);
    console.log('Starting membership tiers seeding...');
    await membershipService.seedMembershipTiers();
    console.log('✅ Membership tiers seeded successfully!');
  } catch (error) {
    console.error('Failed to seed membership tiers:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();