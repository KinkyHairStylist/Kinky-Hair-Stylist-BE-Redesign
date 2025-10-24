import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Salon } from './salon.entity';
import { CreateSalonDto } from './dto/create.salon.dto';

@Injectable()
export class SalonRepository {
  constructor(
    @InjectRepository(Salon)
    private readonly repository: Repository<Salon>,
  ) {}

  createQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }

  findOne(options: FindOneOptions<Salon>) {
    return this.repository.findOne(options);
  }

  create(createSalonDto: CreateSalonDto) {
    return this.repository.create(createSalonDto);
  }

  save(salon: Salon) {
    return this.repository.save(salon);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }

  // Calculate distance using Haversine formula
  async findNearbySalons(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<Salon[]> {
    const query = this.repository
      .createQueryBuilder('salon')
      .select([
        'salon.id',
        'salon.name',
        'salon.address',
        'salon.latitude',
        'salon.longitude',
        'salon.rating',
        'salon.reviewCount',
        'salon.services',
        'ROUND(6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(salon.latitude)) * COS(RADIANS(salon.longitude) - RADIANS(:lng)) + SIN(RADIANS(:lat)) * SIN(RADIANS(salon.latitude))), 2) AS distance',
      ])
      .where('salon.isActive = true')
      .andWhere(
        `6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(salon.latitude)) * COS(RADIANS(salon.longitude) - RADIANS(:lng)) + SIN(RADIANS(:lat)) * SIN(RADIANS(salon.latitude))) <= :radius`,
      )
      .orderBy('distance', 'ASC')
      .setParameters({ lat, lng, radius: radiusKm });

    const result = await query.getRawMany();

    // Map raw results back to Salon entities (excluding distance)
    return result.map((row) => {
      const salon = new Salon();
      salon.id = row.salon_id;
      salon.name = row.salon_name;
      salon.address = row.salon_address;
      salon.latitude = row.salon_latitude;
      salon.longitude = row.salon_longitude;
      salon.rating = row.salon_rating;
      salon.reviewCount = row.salon_reviewCount;
      salon.services = row.salon_services;
      salon.distance = parseFloat(row.distance); // Add distance as non-persistent field
      return salon;
    });
  }

  // Add distance property to Salon entity (non-persistent)
  addDistanceToSalons(salons: Salon[], lat: number, lng: number): Salon[] {
    return salons.map((salon) => {
      const distance = this.calculateDistance(
        lat,
        lng,
        salon.latitude,
        salon.longitude,
      );
      salon.distance = distance;
      return salon;
    });
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Round to 2 decimal places
  }

  private toRad(x: number): number {
    return (x * Math.PI) / 180;
  }
}