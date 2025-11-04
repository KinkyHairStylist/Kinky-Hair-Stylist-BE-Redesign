import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { User } from '../../all_user_entities/user.entity';
import { CreateBusinessDto } from '../dtos/requests/CreateBusinessDto';
import { getBusinessServices } from '../data/business.services';
import { BookingPoliciesData, BusinessServiceData } from '../types/constants';
import { getBookingPoliciesConfiguration } from '../data/booking-policies';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  /**
   * Creates a new business linked to the authenticated user.
   * @param createBusinessDto The data for the new business.
   * @param owner The user entity of the business owner.
   * @returns The created business entity.
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    owner: User,
  ): Promise<Business> {
    const business = this.businessRepo.create({
      ...createBusinessDto,
      owner,
    });

    business.ownerName = (owner?.firstName + " " + owner?.surname)|| ""
    business.ownerEmail = owner?.email || ""
    business.ownerPhone = owner?.phoneNumber || ""

    return await this.businessRepo.save(business);
  }

  getServices(): BusinessServiceData[] {
    return getBusinessServices();
  }

  getBookingPoliciesConfiguration(): BookingPoliciesData[] {
    return getBookingPoliciesConfiguration();
  }
}