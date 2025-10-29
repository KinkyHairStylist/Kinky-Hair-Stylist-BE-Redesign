import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from '../dtos/create-booking.dto';

import { BookingService } from '../services/booking.service';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('api/bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'The booking has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateBookingDto })
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(createBookingDto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a booking' })
  @ApiResponse({ status: 200, description: 'The booking has been successfully confirmed.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          example: '12345',
        },
      },
    },
  })
  async confirmBooking(@Body('orderId') orderId: string) {
    return this.bookingService.confirmBooking(orderId);
  }

  @Get('salon/:salonId')
  getSalonBookings() {
    // Return available dates/times for salon
    return {
      availableDates: ['2025-08-27', '2025-08-28', '2025-08-29', '2025-08-30'],
      timeSlots: [
        '9:00 AM',
        '9:15 AM',
        '9:30 AM',
        '9:45 AM',
        '10:00 AM',
        '10:15 AM',
        '10:30 AM',
        '10:45 AM',
      ],
    };
  }
}
