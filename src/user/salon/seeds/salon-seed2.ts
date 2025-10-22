// src/salon/seeds/salon-seed2.ts

import { Injectable } from '@nestjs/common';
import { SalonService } from '../salon.service';
import { CreateSalonDto } from '../dto/create-salon.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SalonService as SalonServiceEntity } from '../salon-service.entity';

@Injectable()
export class SalonSeed2 {
  constructor(
    private readonly salonService: SalonService,
    @InjectRepository(SalonServiceEntity)
    private readonly salonServiceRepo: Repository<SalonServiceEntity>,
  ) {}

  async run() {
    console.log('Seeding salons with fresh data...');

    const salons = [
      {
        name: 'AfroVibes Salon',
        description: 'Specializing in kinky, coily, and curly hair textures.',
        address: '101 Kinky Lane, Lagos, Nigeria',
        latitude: 6.5244,
        longitude: 3.3792,
        rating: 4.9,
        reviewCount: 250,
        services: ['Twist Outs', 'Bantu Knots', 'Silk Press', 'Protective Styling'],
        isActive: true,
      },
      {
        name: 'Naija Naturals',
        description: 'A haven for natural hair enthusiasts in the heart of Abuja.',
        address: '202 Natural Way, Abuja, Nigeria',
        latitude: 9.0765,
        longitude: 7.3986,
        rating: 4.8,
        reviewCount: 180,
        services: ['Haircut', 'Deep Conditioning', 'Henna Treatment', 'Cornrows'],
        isActive: true,
      },
      {
        name: 'The Kinky Crown',
        description: 'Luxury salon celebrating the beauty of afro-textured hair.',
        address: '303 Crown Court, Port Harcourt, Nigeria',
        latitude: 4.75,
        longitude: 7.0,
        rating: 4.7,
        reviewCount: 150,
        services: ['Locs Maintenance', 'Faux Locs', 'Hair Coloring', 'Bridal Styling'],
        isActive: true,
      },
    ];

    for (const salon of salons) {
      // Create the salon first to get its ID
      const createdSalon = await this.salonService.create(salon as CreateSalonDto);
      console.log(`✅ Created salon: ${salon.name}`);

      // Create services for this salon with the salonId
      const serviceEntities = salon.services.map(name => {
        return this.salonServiceRepo.create({
          name,
          description: `${name} service at ${salon.name}`,
          price: 100,
          duration: '60 minutes',
          tag: 'General',
          isActive: true,
          salonId: createdSalon.id, // Associate with salon
        });
      });

      await this.salonServiceRepo.save(serviceEntities);
      console.log(`🆕 Created services for ${salon.name}: ${salon.services.join(', ')}`);
    }

    console.log(`🎉 Successfully seeded ${salons.length} salons with services.`);
  }
}
