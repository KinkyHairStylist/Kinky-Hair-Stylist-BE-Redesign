// src/salon/seeds/seeds.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '../salon.entity';
import { SalonImage } from '../salon-image.entity';
import { SalonSeed } from './salon-seed';
import { ImageSeed } from './image-seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([Salon, SalonImage]),
  ],
  providers: [SalonSeed, ImageSeed],
  exports: [SalonSeed, ImageSeed],
})
export class SeedsModule {}