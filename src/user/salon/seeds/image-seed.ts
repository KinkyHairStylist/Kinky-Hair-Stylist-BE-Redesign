import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonImage } from '../salon-image.entity';
import { Salon } from '../salon.entity';

@Injectable()
export class ImageSeed {
  constructor(
    @InjectRepository(SalonImage)
    private salonImageRepository: Repository<SalonImage>,
    @InjectRepository(Salon)
    private salonRepository: Repository<Salon>,
  ) {}

  async run() {
    console.log('Seeding salon images...');

    // Real image URLs from Unsplash (free to use)
    const imageUrls = [
      'https://images.unsplash.com/photo-1560869713-eb4b1a942f4e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560869713-eb4b1a942f4e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560869713-eb4b1a942f4e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560869713-eb4b1a942f4e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560869713-eb4b1a942f4e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&h=600&fit=crop',
    ];

    const salons = await this.salonRepository.find();

    for (let i = 0; i < salons.length; i++) {
      const salon = salons[i];

      // Assign 3-5 random images to each salon
      const numImages = Math.floor(Math.random() * 3) + 3; // 3-5 images
      for (let j = 0; j < numImages; j++) {
        const imageUrl = imageUrls[(i * 3 + j) % imageUrls.length];

        const image = this.salonImageRepository.create({
          url: imageUrl,
          caption: `Image ${j + 1} for ${salon.name}`,
          isPrimary: j === 0, // First image is primary
          salon: salon,
          salonId: salon.id,
        });

        await this.salonImageRepository.save(image);
      }
    }

    console.log(`✅ Seeded images for ${salons.length} salons`);
  }
}