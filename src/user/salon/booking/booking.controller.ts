// src/booking/booking.controller.ts

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('api/bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('create')
  async createBooking(@Body() createBookingDto: any) {
    return this.bookingService.createBooking(createBookingDto);
  }

  @Post('confirm')
  async confirmBooking(@Body('orderId') orderId: string) {
    return this.bookingService.confirmBooking(orderId);
  }

  @Get('salon/:salonId')
  async getSalonBookings(@Query('salonId') salonId: number) {
    // Return available dates/times for salon
    return {
      availableDates: ['2025-08-27', '2025-08-28', '2025-08-29', '2025-08-30'],
      timeSlots: ['9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM']
    };
  }
}