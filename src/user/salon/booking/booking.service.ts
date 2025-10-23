import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { PayPalService } from './paypal.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private paypalService: PayPalService,
  ) {}

  async createBooking(createBookingDto: any): Promise<{ orderId: string }> {
    // Create PayPal order
    const orderId = await this.paypalService.createOrder(
      createBookingDto.totalAmount,
    );

    // Save booking with pending status
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: 'pending',
      paypalOrderId: orderId,
    });

    await this.bookingRepository.save(booking);
    return { orderId };
  }

  async confirmBooking(orderId: string): Promise<Booking> {
    // Capture PayPal payment
    await this.paypalService.captureOrder(orderId);

    // Update booking status
    const booking = await this.bookingRepository.findOne({
      where: { paypalOrderId: orderId },
    });
    if (booking) {
      booking.status = 'confirmed';
      return this.bookingRepository.save(booking);
    }
    throw new Error('Booking not found');
  }
}