import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '../user_entities/salon.entity';
import { SalonImage } from '../user_entities/salon-image.entity';
import { SalonSeed } from './salon-seed';
import { ImageSeed } from './image-seed';
import { UserSeed } from './user-seed';
import { User } from 'src/all_user_entities/user.entity';
import { Business } from 'src/business/entities/business.entity';
import { Review } from 'src/business/entities/review.entity';
import { ReviewSeed } from './review.seed';
// import { BusinessSeed } from './business-seed';

@Module({
  imports: [TypeOrmModule.forFeature([Salon, SalonImage, User])],
  providers: [SalonSeed, ImageSeed, UserSeed],
  exports: [SalonSeed, ImageSeed, UserSeed],
})
export class SeedsModule {}
