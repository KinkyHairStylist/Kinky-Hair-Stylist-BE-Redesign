import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../user_entities/booking.entity';
import { User } from '../../all_user_entities/user.entity';
import { Salon } from '../user_entities/salon.entity';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBookingService = {
    createBooking: jest.fn(),
    confirmBooking: jest.fn(),
    getUserBookings: jest.fn(),
    getBookingById: jest.fn(),
    cancelBooking: jest.fn(),
    rescheduleBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBooking', () => {
    it('should create a booking', async () => {
      const createBookingDto: CreateBookingDto = {
        userId: 'bbf9f0a9-b83e-418b-8f8c-bb06f547b1f9',
        salonId: 'bbf9f0a9-b83e-418b-8f8c-bb06f547b1f9',
        date: new Date(),
        time: '10:00',
        totalAmount: 100,
        serviceIds: [1, 2],
      };
      const result = { orderId: '12345' };
      mockBookingService.createBooking.mockResolvedValue(result);

      expect(await controller.createBooking(createBookingDto)).toBe(result);
      expect(service.createBooking).toHaveBeenCalledWith(createBookingDto);
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a booking', async () => {
      const orderId = '12345';
      const booking = new Booking();
      booking.id = 1;
      booking.status = 'confirmed';
      mockBookingService.confirmBooking.mockResolvedValue(booking);

      expect(await controller.confirmBooking(orderId)).toBe(booking);
      expect(service.confirmBooking).toHaveBeenCalledWith(orderId);
    });
  });

  describe('getUserBookings', () => {
    it('should return an array of bookings for a user', async () => {
      const userId = '1';
      const bookings: Booking[] = [new Booking()];
      mockBookingService.getUserBookings.mockResolvedValue(bookings);

      expect(await controller.getUserBookings(userId)).toBe(bookings);
      expect(service.getUserBookings).toHaveBeenCalledWith(userId);
    });
  });

  describe('getBookingById', () => {
    it('should return a single booking', async () => {
      const id = 1;
      const booking = new Booking();
      mockBookingService.getBookingById.mockResolvedValue(booking);

      expect(await controller.getBookingById(id)).toBe(booking);
      expect(service.getBookingById).toHaveBeenCalledWith(id);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      const id = 1;
      const booking = new Booking();
      booking.status = 'cancelled';
      mockBookingService.cancelBooking.mockResolvedValue(booking);

      expect(await controller.cancelBooking(id)).toBe(booking);
      expect(service.cancelBooking).toHaveBeenCalledWith(id);
    });
  });

  describe('rescheduleBooking', () => {
    it('should reschedule a booking', async () => {
      const id = 1;
      const newDate = '2025-11-10';
      const newTime = '14:00';
      const booking = new Booking();
      mockBookingService.rescheduleBooking.mockResolvedValue(booking);

      expect(await controller.rescheduleBooking(id, newDate, newTime)).toBe(
        booking,
      );
      expect(service.rescheduleBooking).toHaveBeenCalledWith(
        id,
        new Date(newDate),
        newTime,
      );
    });
  });
});
