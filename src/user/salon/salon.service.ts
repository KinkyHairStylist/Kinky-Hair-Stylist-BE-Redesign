// src/salon/salon.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like, MoreThanOrEqual } from 'typeorm';
import { Salon } from './salon.entity';
import { SalonImage } from './salon-image.entity';
import { SalonService as SalonServiceEntity } from './salon-service.entity';
import { CreateSalonDto } from './dto/create-salon.dto';

@Injectable()
export class SalonService {
  constructor(
    @InjectRepository(Salon)
    private salonRepository: Repository<Salon>,
    @InjectRepository(SalonImage)
    private salonImageRepository: Repository<SalonImage>,
    @InjectRepository(SalonServiceEntity)
    private salonServiceRepository: Repository<SalonServiceEntity>
  ) {}

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    minRating?: number;
    services?: string[];
    sortBy?: 'bestMatch' | 'topRated' | 'distance';
    lat?: number;
    lng?: number;
  }) {
    const { page = 1, limit = 10, search, location, minRating, services } = options;
    const baseWhere: any = {};

    if (location) {
      baseWhere.address = Like(`%${location}%`);
    }

    if (minRating) {
      baseWhere.rating = MoreThanOrEqual(minRating);
    }

    if (services && services.length > 0) {
      baseWhere.services = {
        name: In(services),
      };
    }

    let where: any = baseWhere;
    if (search) {
      where = [
        { ...baseWhere, name: Like(`%${search}%`) },
        { ...baseWhere, description: Like(`%${search}%`) },
      ];
    }

    const [result, total] = await this.salonRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      relations: ['services'],
    });

    return {
      data: result,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Salon> {
    const salon = await this.salonRepository.findOne({
      where: { id },
      relations: ['images', 'services']
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID ${id} not found`);
    }

    return salon;
  }

  async findImages(salonId: number): Promise<SalonImage[]> {
    return this.salonImageRepository.find({
      where: { salonId },
      order: { isPrimary: 'DESC' }
    });
  }

  async findServices(salonId: number): Promise<SalonServiceEntity[]> {
    return this.salonServiceRepository.find({
      where: { salon: { id: salonId }, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async create(createSalonDto: CreateSalonDto): Promise<Salon> {
    const { services: serviceNames, ...salonData } = createSalonDto;

    const services = await this.salonServiceRepository.findBy({
      name: In(serviceNames),
    });

    if (services.length !== serviceNames.length) {
      throw new NotFoundException('One or more services not found');
    }

    const newSalon = this.salonRepository.create({
      ...salonData,
      services,
    });

    return this.salonRepository.save(newSalon);
  }

  // 👇 NEW: Get salon with full details
  async getSalonDetails(id: number) {
    const salon = await this.findOne(id);
    const images = await this.findImages(id);
    const services = await this.findServices(id);
    
    return {
      ...salon,
      images,
      services
    };
  }
}
