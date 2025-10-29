import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '../user_entities/salon.entity';
import { SalonImage } from '../user_entities/salon-image.entity';
import { SalonSeed } from './salon-seed';
import { ImageSeed } from './image-seed';

@Module({
  imports: [TypeOrmModule.forFeature([Salon, SalonImage])],
  providers: [SalonSeed, ImageSeed],
  exports: [SalonSeed, ImageSeed],
})
export class SeedsModule {}