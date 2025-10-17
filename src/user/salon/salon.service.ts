// src/salon/salon.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salon } from './salon.entity';
import { SalonImage } from './salon-image.entity';
import { SalonRepository } from './salon.repository';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';

@Injectable()
export class SalonService {
  constructor(
    @InjectRepository(Salon)
    private salonRepository: SalonRepository,
    @InjectRepository(SalonImage)
    private salonImageRepository: Repository<SalonImage>
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
  }): Promise<{ data: Salon[]; total: number; page: number; limit: number }> {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      location = '', 
      minRating = 0, 
      services = [], 
      sortBy = 'bestMatch',
      lat,
      lng
    } = options;

    let query = this.salonRepository.createQueryBuilder('salon')
      .where('salon.isActive = true');

    if (search) {
      query = query.andWhere('LOWER(salon.name) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (location) {
      query = query.andWhere('LOWER(salon.address) LIKE LOWER(:location)', { location: `%${location}%` });
    }

    if (minRating > 0) {
      query = query.andWhere('salon.rating >= :minRating', { minRating });
    }

    if (services.length > 0) {
      services.forEach((service, index) => {
        query = query.andWhere(`:service${index} = ANY(salon.services)`, { [`service${index}`]: service });
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'topRated':
        query = query.orderBy('salon.rating', 'DESC').addOrderBy('salon.reviewCount', 'DESC');
        break;
      case 'distance':
        if (lat && lng) {
          query = query.addSelect(
            `ROUND((6371 * ACOS(COS(RADIANS(${lat})) * COS(RADIANS(salon.latitude)) * COS(RADIANS(salon.longitude) - RADIANS(${lng})) + SIN(RADIANS(${lat})) * SIN(RADIANS(salon.latitude))))::numeric, 2)`,
            'distance'
          )
          .orderBy('distance', 'ASC');
        }
        break;
      case 'bestMatch':
      default:
        query = query.orderBy('salon.rating', 'DESC').addOrderBy('salon.createdAt', 'DESC');
        break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    const [data, total] = await query.skip(offset).take(limit).getManyAndCount();

    // Add distance if sorting by distance or if lat/lng provided
    if ((sortBy === 'distance' || (lat && lng)) && !query.getQuery().includes('distance')) {
      const salonsWithDistance = this.salonRepository.addDistanceToSalons(data, lat || 0, lng || 0);
      return { data: salonsWithDistance, total, page, limit };
    }

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Salon> {
    const salon = await this.salonRepository.findOne({
      where: { id },
      relations: ['images']
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

  async create(createSalonDto: CreateSalonDto): Promise<Salon> {
    const salon = this.salonRepository.create(createSalonDto);
    return this.salonRepository.save(salon);
  }

  async update(id: number, updateSalonDto: UpdateSalonDto): Promise<Salon> {
    const salon = await this.findOne(id);
    Object.assign(salon, updateSalonDto);
    return this.salonRepository.save(salon);
  }

  async remove(id: number): Promise<void> {
    await this.salonRepository.delete(id);
  }
}
