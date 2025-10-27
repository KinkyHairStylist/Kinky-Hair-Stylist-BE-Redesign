// src/salon/seeds/seeds.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '../salon.entity';
import { SalonImage } from '../salon-image.entity';
import { SalonService as SalonServiceEntity } from '../salon-service.entity';
import { SalonSeed } from './salon-seed';
import { ImageSeed } from './image-seed';
import { SalonSeed2 } from './salon-seed2';
import { ServiceSeed } from './service-seed';
import { SalonService } from '../salon.service';
import { MembershipSeedModule } from '../../../membership/seeds/seed.module';
import { MembershipSeed } from '../../../membership/seeds/membership-seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([Salon, SalonImage, SalonServiceEntity]),
    MembershipSeedModule,
  ],
  providers: [SalonSeed, ImageSeed, SalonSeed2, ServiceSeed, SalonService],
  exports: [SalonSeed, ImageSeed, SalonSeed2, ServiceSeed],
})
export class SeedsModule {}
