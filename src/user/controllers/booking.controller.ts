import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dtos/create-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('/bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  // Create a new booking
  @Post('create')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'The booking has been successfully created.' })
  @ApiBody({ type: CreateBookingDto })
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(createBookingDto);
  }

  // Confirm a booking
  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a booking' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: '12345' },
      },
    },
  })
  async confirmBooking(@Body('orderId') orderId: string) {
    return this.bookingService.confirmBooking(orderId);
  }

  // Get user bookings
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all bookings for a user' })
  async getUserBookings(@Param('userId') userId: string) {
    return this.bookingService.getUserBookings(userId);
  }

  // Get single booking details
  @Get(':id')
  @ApiOperation({ summary: 'Get single booking details by ID' })
  async getBookingById(@Param('id') id: number) {
    return this.bookingService.getBookingById(id);
  }

  // Cancel booking
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancelBooking(@Param('id') id: number) {
    return this.bookingService.cancelBooking(id);
  }

  //  Reschedule booking
  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a booking' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newDate: { type: 'string', example: '2025-11-10' },
        newTime: { type: 'string', example: '14:00' },
      },
    },
  })
  async rescheduleBooking(
    @Param('id') id: number,
    @Body('newDate') newDate: string,
    @Body('newTime') newTime: string,
  ) {
    return this.bookingService.rescheduleBooking(id, new Date(newDate), newTime);
  }

  // (Existing) Get salon time slots (static example)
  @Get('salon/:salonId')
  async getSalonBookings() {
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
