import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipTier, UserMembership } from '../membership.entity';
import { MembershipService } from '../membership.service';
import { MembershipSeed } from './membership-seed';
import { User } from 'src/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipTier, UserMembership, User]),
  ],
  providers: [MembershipService, MembershipSeed],
  exports: [MembershipSeed],
})
export class MembershipSeedModule {}
