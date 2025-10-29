import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '../user_entities/salon.entity';
import { SalonImage } from '../user_entities/salon-image.entity';
import { SalonController } from '../controllers/salon.controller';
import { SalonService } from '../services/salon.service';
import { SalonRepository } from '../user_utilities/salon.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Salon, SalonImage])],
  controllers: [SalonController],
  providers: [SalonService, SalonRepository],
  exports: [SalonService],
})
export class SalonModule {}