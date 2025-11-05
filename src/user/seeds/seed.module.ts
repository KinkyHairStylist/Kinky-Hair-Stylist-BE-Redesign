import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '../user_entities/salon.entity';
import { SalonImage } from '../user_entities/salon-image.entity';
import { SalonSeed } from './salon-seed';
import { ImageSeed } from './image-seed';
import { UserSeed } from './user-seed';
import { User } from 'src/all_user_entities/user.entity';
import { Business } from 'src/business/entities/business.entity';
import { BusinessSeed } from './business-seed';

@Module({
  imports: [TypeOrmModule.forFeature([Salon, SalonImage, User, Business])],
  providers: [SalonSeed, ImageSeed, UserSeed, BusinessSeed],
  exports: [SalonSeed, ImageSeed, UserSeed, BusinessSeed],
})
export class SeedsModule {}
