// src/membership/membership.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipTier, UserMembership } from './membership.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipTier, UserMembership, User])],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}