import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { BookingService } from '../salon/booking/booking.service';
// import { Booking } from '../user_entities/booking.entity';
import { Booking } from '../user_entities/booking.entity';
import { BookingService } from '../services/booking.service';
import { BookingController } from '../controllers/booking.controller';
import { PayPalService } from '../services/paypal.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  controllers: [BookingController],
  providers: [BookingService, PayPalService],
})
export class BookingModule {}