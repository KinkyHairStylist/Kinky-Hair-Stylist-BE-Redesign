import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { BookingService } from '../salon/booking/booking.service';
// import { Booking } from '../user_entities/booking.entity';
import { Booking } from '../user_entities/booking.entity';
import { BookingService } from '../services/booking.service';
import { BookingController } from '../controllers/booking.controller';
import { PayPalService } from '../services/paypal.service';
import { GiftCard } from 'src/all_user_entities/gift-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, GiftCard])],
  controllers: [BookingController],
  providers: [BookingService, PayPalService],
})
export class BookingModule {}
