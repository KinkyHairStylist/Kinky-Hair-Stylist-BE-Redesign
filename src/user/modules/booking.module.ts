import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'src/business/entities/appointment.entity';
import { Business } from 'src/business/entities/business.entity';
import { Service } from 'src/business/entities/service.entity';
import { Staff } from 'src/business/entities/staff.entity';
import { Transaction } from 'src/business/entities/transaction.entity';
import { BookingService } from '../services/booking.service';
import { BookingController } from '../controllers/booking.controller';
import { PayPalService } from '../services/paypal.service';
import { GiftCard } from 'src/all_user_entities/gift-card.entity';
import { PlatformSettingsService } from 'src/admin/platform-settings/platform-settings.service';
import { PlatformSettingsEntity } from 'src/admin/platform-settings/entities/platform-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Business, Service, Staff, Transaction, GiftCard, PlatformSettingsEntity])
  ],
  controllers: [BookingController],
  providers: [BookingService, PayPalService, PlatformSettingsService],
})
export class BookingModule {}
