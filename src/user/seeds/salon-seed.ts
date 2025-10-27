import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salon } from '../user_entities/salon.entity';

@Injectable()
export class SalonSeed {
  constructor(
    @InjectRepository(Salon)
    private salonRepository: Repository<Salon>,
  ) {}

  async run() {
    console.log('Seeding salons...');

    const salons = [
      {
        name: 'Saw What Is',
        description: 'Hair & Beauty Salon offering premium services in Sydney.',
        address: '123 George St, Sydney NSW 2000',
        latitude: -33.8688,
        longitude: 151.2093,
        rating: 4.5,
        reviewCount: 127,
        services: ['Haircut', 'Coloring', 'Styling', 'Treatment'],
        isActive: true,
      },
      {
        name: 'Bohoicentric',
        description:
          'Premium Luxury Salon in Sydney with award-winning stylists.',
        address: '456 Pitt St, Sydney NSW 2000',
        latitude: -33.865,
        longitude: 151.2094,
        rating: 4.8,
        reviewCount: 89,
        services: ['Haircut', 'Coloring', 'Extensions', 'Bridal Styling'],
        isActive: true,
      },
      {
        name: 'Elite Hair Studio',
        description: 'Modern Hair Styling Center with cutting-edge techniques.',
        address: '789 Hunter St, Sydney NSW 2000',
        latitude: -33.87,
        longitude: 151.205,
        rating: 4.7,
        reviewCount: 156,
        services: ['Haircut', 'Coloring', 'Perms', 'Keratin Treatment'],
        isActive: true,
      },
      {
        name: 'Bohaircentric',
        description: 'Private Luxury Salon in Sydney for discerning clients.',
        address: '101 York St, Sydney NSW 2000',
        latitude: -33.872,
        longitude: 151.21,
        rating: 4.6,
        reviewCount: 203,
        services: ['Haircut', 'Coloring', 'Bridal', "Men's Grooming"],
        isActive: true,
      },
      {
        name: 'Urban Hair Co.',
        description: 'Trendy salon in the heart of the city with modern vibes.',
        address: '202 Elizabeth St, Sydney NSW 2000',
        latitude: -33.8675,
        longitude: 151.208,
        rating: 4.9,
        reviewCount: 312,
        services: ['Haircut', 'Coloring', 'Barber Services', 'Beard Trimming'],
        isActive: true,
      },
      {
        name: 'Glamour Locks',
        description: 'Specializing in natural hair care and styling.',
        address: '303 King St, Sydney NSW 2000',
        latitude: -33.869,
        longitude: 151.2075,
        rating: 4.4,
        reviewCount: 98,
        services: ['Natural Hair', 'Braids', 'Twists', 'Extensions'],
        isActive: true,
      },
      {
        name: 'The Cutting Edge',
        description: 'Innovative salon with top stylists and latest trends.',
        address: '404 Market St, Sydney NSW 2000',
        latitude: -33.866,
        longitude: 151.2065,
        rating: 4.7,
        reviewCount: 189,
        services: ['Haircut', 'Coloring', 'Styling', 'Updos'],
        isActive: true,
      },
      {
        name: 'Pure Beauty Salon',
        description:
          'Eco-friendly salon using organic products and sustainable practices.',
        address: '505 Castlereagh St, Sydney NSW 2000',
        latitude: -33.868,
        longitude: 151.209,
        rating: 4.6,
        reviewCount: 145,
        services: ['Haircut', 'Coloring', 'Organic Treatments', 'Scalp Care'],
        isActive: true,
      },
      {
        name: 'Style Haven',
        description: 'Relaxing environment with personalized styling services.',
        address: '606 George St, Sydney NSW 2000',
        latitude: -33.8695,
        longitude: 151.2085,
        rating: 4.5,
        reviewCount: 112,
        services: ['Haircut', 'Coloring', 'Styling', 'Waxing'],
        isActive: true,
      },
      {
        name: 'Crown & Glory',
        description:
          'Luxury salon for special occasions and red carpet events.',
        address: '707 Pitt St, Sydney NSW 2000',
        latitude: -33.8655,
        longitude: 151.2095,
        rating: 4.8,
        reviewCount: 76,
        services: ['Bridal Styling', 'Event Hair', 'Makeup', 'Extensions'],
        isActive: true,
      },
    ];

    for (const salon of salons) {
      await this.salonRepository.save(this.salonRepository.create(salon));
    }

    console.log(`✅ Seeded ${salons.length} salons`);
  }
}