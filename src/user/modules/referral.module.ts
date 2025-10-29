import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from '../user_entities/referrals.entity';
import { Booking } from '../user_entities/booking.entity';
import { User } from '../../all_user_entities/user.entity';
import { ReferralService } from '../services/referral.service';
import { ReferralController } from '../controllers/referral.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, Booking, User])],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
