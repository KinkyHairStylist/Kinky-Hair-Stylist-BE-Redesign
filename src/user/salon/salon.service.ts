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

    const newSalon = this.salonRepository.create(salonData);
    await this.salonRepository.save(newSalon);

    const serviceDefinitions = {
      'Twist Outs': { description: 'Beautiful twist outs for natural hair.', price: 50.00, duration: '1h 30m' },
      'Bantu Knots': { description: 'Stylish Bantu knots for a unique look.', price: 60.00, duration: '2h' },
      'Silk Press': { description: 'Sleek and smooth silk press.', price: 80.00, duration: '2h 30m' },
      'Protective Styling': { description: 'Various protective styles to keep your hair healthy.', price: 70.00, duration: '3h' },
      'Haircut': { description: 'Precision haircuts for all hair types.', price: 40.00, duration: '1h' },
      'Deep Conditioning': { description: 'Intensive deep conditioning treatment.', price: 30.00, duration: '45m' },
      'Henna Treatment': { description: 'Natural henna treatment for color and conditioning.', price: 60.00, duration: '2h' },
      'Cornrows': { description: 'Classic cornrow styles.', price: 50.00, duration: '1h 30m' },
      'Locs Maintenance': { description: 'Professional locs maintenance.', price: 70.00, duration: '2h' },
      'Faux Locs': { description: 'Beautiful and realistic faux locs.', price: 150.00, duration: '4h' },
      'Hair Coloring': { description: 'Vibrant hair coloring services.', price: 100.00, duration: '3h' },
      'Bridal Styling': { description: 'Elegant bridal styling for your special day.', price: 200.00, duration: '4h' },
    };

    const services: SalonServiceEntity[] = [];
    for (const name of serviceNames) {
      const serviceData = serviceDefinitions[name] || { description: 'No description available', price: 0, duration: 'N/A' };
      const service = this.salonServiceRepository.create({
        name,
        ...serviceData,
        salon: newSalon,
      });
      await this.salonServiceRepository.save(service);
      services.push(...service);
    }

    newSalon.services = services;
    return newSalon;
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
