import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSettingsController } from './controllers/business-settings.controller';
import { Business } from './entities/business.entity';
import { BusinessSettingsService } from './services/business-settings.service';
import { Module } from '@nestjs/common';
import { BookingDay } from './entities/booking-day.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business, BookingDay])],
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
