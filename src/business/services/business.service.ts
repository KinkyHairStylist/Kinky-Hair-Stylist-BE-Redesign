import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from '../entities/business.entity';
import { CreateBusinessDto, BookingHoursDto } from '../dtos/requests/business.dto';
import { CompanySize } from '../types/constants';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
  ) {}

  async createBusiness(createBusinessDto: CreateBusinessDto, ownerId: string): Promise<ApiResponse> {
    try {
      // Ensure bookingHours has the correct type
      const bookingHours: Array<{
        day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
        isOpen: boolean;
        startTime: string;
        endTime: string;
      }> = createBusinessDto.bookingHours.map(hour => ({
        day: hour.day as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
        isOpen: hour.isOpen,
        startTime: hour.startTime,
        endTime: hour.endTime,
      }));

      const businessData = {
        ...createBusinessDto,
        ownerId,
        companySize: createBusinessDto.companySize as CompanySize,
        bookingHours: bookingHours,
      };

      const business = this.businessRepository.create(businessData);

      const savedBusiness = await this.businessRepository.save(business);

      return {
        success: true,
        message: 'Business created successfully',
        data: savedBusiness,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create business',
        error: error.message,
      };
    }
  }

  async getBusinessByOwner(ownerId: string): Promise<ApiResponse> {
    try {
      const business = await this.businessRepository.findOne({
        where: { ownerId },
        relations: ['owner'],
      });

      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      return {
        success: true,
        message: 'Business retrieved successfully',
        data: business,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve business',
        error: error.message,
      };
    }
  }

  async getBusinessDetails(ownerId: string): Promise<ApiResponse> {
    try {
      const business = await this.businessRepository.findOne({
        where: { ownerId },
        relations: ['owner'],
      });

      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      return {
        success: true,
        message: 'Business details retrieved successfully',
        data: business,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve business details',
        error: error.message,
      };
    }
  }
}