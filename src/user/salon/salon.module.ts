import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from './salon.entity';
import { SalonImage } from './salon-image.entity';
import { SalonController } from './salon.controller';
import { SalonService } from './salon.service';
import { SalonRepository } from './salon.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Salon, SalonImage])],
  controllers: [SalonController],
  providers: [SalonService, SalonRepository],
  exports: [SalonService],
})
export class SalonModule {}