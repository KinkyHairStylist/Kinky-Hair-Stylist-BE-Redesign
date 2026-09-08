import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantMembershipPackage } from '../entities/merchant-membership-package.entity';
import { Service } from '../entities/service.entity';
import { CreateMerchantMembershipPackageDto } from '../dtos/requests/MerchantMembershipDto';

@Injectable()
export class MerchantMembershipService {
  constructor(
    @InjectRepository(MerchantMembershipPackage)
    private readonly packageRepo: Repository<MerchantMembershipPackage>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(dto: CreateMerchantMembershipPackageDto, businessId: string): Promise<MerchantMembershipPackage> {
    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
      relations: ['business'],
    });
    if (!service) throw new NotFoundException('Service not found');
    if (service.business?.id !== businessId) {
      throw new BadRequestException('Service does not belong to this business');
    }

    const pkg = this.packageRepo.create({
      businessId,
      serviceId: dto.serviceId,
      pricePerSession: dto.pricePerSession,
      sessionCount: dto.sessionCount,
      expiryDays: dto.expiryDays || 365,
      isActive: true,
    });
    return this.packageRepo.save(pkg);
  }

  async listForBusiness(businessId: string): Promise<MerchantMembershipPackage[]> {
    return this.packageRepo.find({
      where: { businessId },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }

  async deactivate(id: string, businessId: string): Promise<MerchantMembershipPackage> {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Membership package not found');
    if (pkg.businessId !== businessId) {
      throw new BadRequestException('Membership package does not belong to this business');
    }
    pkg.isActive = false;
    return this.packageRepo.save(pkg);
  }
}
