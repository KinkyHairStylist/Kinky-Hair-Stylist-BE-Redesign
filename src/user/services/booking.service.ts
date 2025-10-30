import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../user_entities/booking.entity';
import { PayPalService } from './paypal.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private paypalService: PayPalService,
  ) {}

  // Create Booking
  async createBooking(createBookingDto: any): Promise<{ orderId: string }> {
    const orderId = await this.paypalService.createOrder(createBookingDto.totalAmount);

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: 'pending',
      paypalOrderId: orderId,
    });

    await this.bookingRepository.save(booking);
    return { orderId };
  }

  // Confirm Booking
  async confirmBooking(orderId: string): Promise<Booking> {
    await this.paypalService.captureOrder(orderId);

    const booking = await this.bookingRepository.findOne({
      where: { paypalOrderId: orderId },
      relations: ['user', 'salon'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = 'confirmed';
    return this.bookingRepository.save(booking);
  }

  // Get all bookings for a specific user
  async getUserBookings(userId: string): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { user: { id: userId } },
      relations: ['salon', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get single booking details by ID
  async getBookingById(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['salon', 'user'],
    });

    if (!booking) throw new NotFoundException(`Booking with ID ${id} not found`);
    return booking;
  }

  // Cancel a booking
  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking not found`);

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking already cancelled');
    }

    booking.status = 'cancelled';
    return await this.bookingRepository.save(booking);
  }

  // Reschedule a booking
  async rescheduleBooking(id: number, newDate: Date, newTime: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking not found`);

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Cannot reschedule a cancelled booking');
    }

    booking.date = newDate;
    booking.time = newTime;
    return await this.bookingRepository.save(booking);
  }
}
