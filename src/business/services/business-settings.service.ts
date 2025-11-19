import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import {
  UpdateBookingDayDto,
  UpdateBookingDaysDto,
  UpdateBusinessContactDto,
  UpdateBusinessLocationDto,
  UpdateBusinessNameDto,
  UpdateBusinessProfileDto,
} from '../dtos/requests/BusinessSettingsDto';
import { BookingDay } from '../entities/booking-day.entity';

@Injectable()
export class BusinessSettingsService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(BookingDay)
    private readonly bookingDayRepository: Repository<BookingDay>,
  ) {}

  /**
   * Get business profile by owner ID
   */
  async getBusinessProfileByOwnerId(ownerId: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { ownerId },
      relations: [
        'owner',
        'service',
        'bookingPolicies',
        'bookingHours',
        'staff',
        'wallet',
        'ownerSettings',
      ],
    });

    if (!business) {
      throw new NotFoundException(
        `Business not found for owner ID: ${ownerId}`,
      );
    }

    return business;
  }

  /**
   * Get multiple businesses by owner ID (if owner has multiple businesses)
   */
  async getBusinessesByOwnerId(ownerId: string): Promise<Business[]> {
    const businesses = await this.businessRepository.find({
      where: { ownerId },
      relations: [
        'owner',
        'service',
        'bookingPolicies',
        'bookingHours',
        'staff',
        'wallet',
        'ownerSettings',
      ],
    });

    if (!businesses || businesses.length === 0) {
      throw new NotFoundException(
        `No businesses found for owner ID: ${ownerId}`,
      );
    }

    return businesses;
  }

  /**
   * Update business name and description
   */
  async updateBusinessNameAndDescription(
    businessId: string,
    ownerId: string,
    updateDto: UpdateBusinessNameDto,
  ): Promise<Business> {
    const business = await this.findBusinessByIdAndOwner(businessId, ownerId);

    if (updateDto.businessName !== undefined) {
      business.businessName = updateDto.businessName.trim();
    }

    if (updateDto.description !== undefined) {
      business.description = updateDto.description.trim();
    }

    return await this.businessRepository.save(business);
  }

  /**
   * Update business contact information
   */
  async updateBusinessContact(
    businessId: string,
    ownerId: string,
    updateDto: UpdateBusinessContactDto,
  ): Promise<Business> {
    const business = await this.findBusinessByIdAndOwner(businessId, ownerId);

    if (updateDto.ownerName !== undefined) {
      business.ownerName = updateDto.ownerName.trim();
    }

    if (updateDto.ownerEmail !== undefined) {
      // Basic email validation
      if (!this.isValidEmail(updateDto.ownerEmail)) {
        throw new BadRequestException('Invalid email format');
      }
      business.ownerEmail = updateDto.ownerEmail.toLowerCase().trim();
    }

    if (updateDto.ownerPhone !== undefined) {
      business.ownerPhone = updateDto.ownerPhone.trim();
    }

    return await this.businessRepository.save(business);
  }

  /**
   * Update business location
   */
  async updateBusinessLocation(
    businessId: string,
    ownerId: string,
    updateDto: UpdateBusinessLocationDto,
  ): Promise<Business> {
    const business = await this.findBusinessByIdAndOwner(businessId, ownerId);

    if (updateDto.businessAddress !== undefined) {
      business.businessAddress = updateDto.businessAddress.trim();
    }

    if (updateDto.latitude !== undefined) {
      if (updateDto.latitude < -90 || updateDto.latitude > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }
      business.latitude = updateDto.latitude;
    }

    if (updateDto.longitude !== undefined) {
      if (updateDto.longitude < -180 || updateDto.longitude > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }
      business.longitude = updateDto.longitude;
    }

    return await this.businessRepository.save(business);
  }

  /**
   * Edit complete business profile (combined update)
   */
  async editBusinessProfile(
    businessId: string,
    ownerId: string,
    updateDto: UpdateBusinessProfileDto,
  ): Promise<Business> {
    const business = await this.findBusinessByIdAndOwner(businessId, ownerId);

    // Update basic information
    if (updateDto.businessName !== undefined) {
      business.businessName = updateDto.businessName.trim();
    }

    if (updateDto.description !== undefined) {
      business.description = updateDto.description.trim();
    }

    if (updateDto.category !== undefined) {
      business.category = updateDto.category.trim();
    }

    if (updateDto.primaryAudience !== undefined) {
      business.primaryAudience = updateDto.primaryAudience.trim();
    }

    // Update contact information
    if (updateDto.ownerName !== undefined) {
      business.ownerName = updateDto.ownerName.trim();
    }

    if (updateDto.ownerEmail !== undefined) {
      if (!this.isValidEmail(updateDto.ownerEmail)) {
        throw new BadRequestException('Invalid email format');
      }
      business.ownerEmail = updateDto.ownerEmail.toLowerCase().trim();
    }

    if (updateDto.ownerPhone !== undefined) {
      business.ownerPhone = updateDto.ownerPhone.trim();
    }

    // Update location
    if (updateDto.businessAddress !== undefined) {
      business.businessAddress = updateDto.businessAddress.trim();
    }

    if (updateDto.latitude !== undefined) {
      if (updateDto.latitude < -90 || updateDto.latitude > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }
      business.latitude = updateDto.latitude;
    }

    if (updateDto.longitude !== undefined) {
      if (updateDto.longitude < -180 || updateDto.longitude > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }
      business.longitude = updateDto.longitude;
    }

    // Update services array if provided
    if (updateDto.services !== undefined) {
      business.services = updateDto.services;
    }

    return await this.businessRepository.save(business);
  }

  /**
   * Get all booking days for a business
   */
  async getBookingDaysByBusinessId(businessId: string): Promise<BookingDay[]> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['bookingHours'],
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Sort by day of week
    const dayOrder = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return business.bookingHours.sort(
      (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day),
    );
  }

  /**
   * Update a single booking day
   */
  async updateBookingDay(
    bookingDayId: string,
    businessId: string,
    ownerId: string,
    updateDto: UpdateBookingDayDto,
  ): Promise<BookingDay> {
    // Verify business ownership
    await this.verifyBusinessOwnership(businessId, ownerId);

    const bookingDay = await this.bookingDayRepository.findOne({
      where: { id: bookingDayId },
      relations: ['business'],
    });

    if (!bookingDay) {
      throw new NotFoundException(
        `Booking day with ID ${bookingDayId} not found`,
      );
    }

    if (bookingDay.business.id !== businessId) {
      throw new BadRequestException(
        'Booking day does not belong to this business',
      );
    }

    // Update fields
    if (updateDto.day !== undefined) {
      bookingDay.day = updateDto.day;
    }

    if (updateDto.isOpen !== undefined) {
      bookingDay.isOpen = updateDto.isOpen;
    }

    if (updateDto.startTime !== undefined) {
      this.validateTimeFormat(updateDto.startTime);
      bookingDay.startTime = updateDto.startTime;
    }

    if (updateDto.endTime !== undefined) {
      this.validateTimeFormat(updateDto.endTime);
      bookingDay.endTime = updateDto.endTime;
    }

    // Validate start time is before end time
    if (bookingDay.startTime && bookingDay.endTime) {
      this.validateTimeRange(bookingDay.startTime, bookingDay.endTime);
    }

    return await this.bookingDayRepository.save(bookingDay);
  }

  /**
   * Update multiple booking days at once
   */
  async updateBookingDays(
    businessId: string,
    ownerId: string,
    updateDto: UpdateBookingDaysDto,
  ): Promise<BookingDay[]> {
    // Verify business ownership
    await this.verifyBusinessOwnership(businessId, ownerId);

    const updatedDays: BookingDay[] = [];

    for (const dayUpdate of updateDto.bookingDays) {
      const bookingDay = await this.bookingDayRepository.findOne({
        where: { id: dayUpdate.id },
        relations: ['business'],
      });

      if (!bookingDay) {
        throw new NotFoundException(
          `Booking day with ID ${dayUpdate.id} not found`,
        );
      }

      if (bookingDay.business.id !== businessId) {
        throw new BadRequestException(
          `Booking day ${dayUpdate.id} does not belong to this business`,
        );
      }

      // Update fields
      if (dayUpdate.day !== undefined) {
        bookingDay.day = dayUpdate.day;
      }

      if (dayUpdate.isOpen !== undefined) {
        bookingDay.isOpen = dayUpdate.isOpen;
      }

      if (dayUpdate.startTime !== undefined) {
        this.validateTimeFormat(dayUpdate.startTime);
        bookingDay.startTime = dayUpdate.startTime;
      }

      if (dayUpdate.endTime !== undefined) {
        this.validateTimeFormat(dayUpdate.endTime);
        bookingDay.endTime = dayUpdate.endTime;
      }

      // Validate time range
      if (bookingDay.startTime && bookingDay.endTime) {
        this.validateTimeRange(bookingDay.startTime, bookingDay.endTime);
      }

      updatedDays.push(bookingDay);
    }

    return await this.bookingDayRepository.save(updatedDays);
  }

  /**
   * Toggle booking day availability
   */
  async toggleBookingDayAvailability(
    bookingDayId: string,
    businessId: string,
    ownerId: string,
  ): Promise<BookingDay> {
    await this.verifyBusinessOwnership(businessId, ownerId);

    const bookingDay = await this.bookingDayRepository.findOne({
      where: { id: bookingDayId },
      relations: ['business'],
    });

    if (!bookingDay) {
      throw new NotFoundException(
        `Booking day with ID ${bookingDayId} not found`,
      );
    }

    if (bookingDay.business.id !== businessId) {
      throw new BadRequestException(
        'Booking day does not belong to this business',
      );
    }

    bookingDay.isOpen = !bookingDay.isOpen;
    return await this.bookingDayRepository.save(bookingDay);
  }

  /**
   * Verify business ownership
   */
  private async verifyBusinessOwnership(
    businessId: string,
    ownerId: string,
  ): Promise<void> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    if (business.ownerId !== ownerId) {
      throw new BadRequestException(
        'You do not have permission to update this business',
      );
    }
  }

  /**
   * Validate time format (HH:MM)
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException(
        `Invalid time format: ${time}. Expected format: HH:MM (24-hour)`,
      );
    }
  }

  /**
   * Validate start time is before end time
   */
  private validateTimeRange(startTime: string, endTime: string): void {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  /**
   * Helper method to find business by ID and verify ownership
   */
  private async findBusinessByIdAndOwner(
    businessId: string,
    ownerId: string,
  ): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    if (business.ownerId !== ownerId) {
      throw new BadRequestException(
        'You do not have permission to update this business',
      );
    }

    return business;
  }

  /**
   * Helper method for email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
