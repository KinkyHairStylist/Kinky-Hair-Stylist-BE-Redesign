// src/salon/seeds/service-seed.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonService as SalonServiceEntity } from '../salon-service.entity';

@Injectable()
export class ServiceSeed {
  constructor(
    @InjectRepository(SalonServiceEntity)
    private salonServiceRepository: Repository<SalonServiceEntity>,
  ) {}

  async run() {
    console.log('Seeding services...');

    const services = [
      { name: 'Twist Outs', description: 'Beautiful twist outs for natural hair.', price: 50.00, duration: '1h 30m' },
      { name: 'Bantu Knots', description: 'Stylish Bantu knots for a unique look.', price: 60.00, duration: '2h' },
      { name: 'Silk Press', description: 'Sleek and smooth silk press.', price: 80.00, duration: '2h 30m' },
      { name: 'Protective Styling', description: 'Various protective styles to keep your hair healthy.', price: 70.00, duration: '3h' },
      { name: 'Haircut', description: 'Precision haircuts for all hair types.', price: 40.00, duration: '1h' },
      { name: 'Deep Conditioning', description: 'Intensive deep conditioning treatment.', price: 30.00, duration: '45m' },
      { name: 'Henna Treatment', description: 'Natural henna treatment for color and conditioning.', price: 60.00, duration: '2h' },
      { name: 'Cornrows', description: 'Classic cornrow styles.', price: 50.00, duration: '1h 30m' },
      { name: 'Locs Maintenance', description: 'Professional locs maintenance.', price: 70.00, duration: '2h' },
      { name: 'Faux Locs', description: 'Beautiful and realistic faux locs.', price: 150.00, duration: '4h' },
      { name: 'Hair Coloring', description: 'Vibrant hair coloring services.', price: 100.00, duration: '3h' },
      { name: 'Bridal Styling', description: 'Elegant bridal styling for your special day.', price: 200.00, duration: '4h' },
    ];

    for (const service of services) {
      await this.salonServiceRepository.save(service);
    }

    console.log(`✅ Seeded ${services.length} services`);
  }
}
