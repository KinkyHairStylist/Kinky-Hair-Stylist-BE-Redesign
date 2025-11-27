// {
//     id: "d3e1a6c9-4b75-4e3f-9b84-3e6c9af91201",
//     clientId: "f71b2e7d-9c33-4aaf-bae4-1c8b7489a210",
//     businessId: "ab93cd77-4aa1-45f5-9e89-bf2d8f001a55",
//     rating: 5,
//     comment: "Amazing service! The staff were friendly and the process was fast. Definitely recommend.",
//     reply: null,
//     replyTime: null,
//     likes: 12,
//     clientName: "John Carter",
//     clientProfileImage: "https://example.com/images/john.png",
//     service: "Deluxe Cleaning Package",
//     clientType: ClientType.VERIFIED,
//     createdAt: new Date("2024-01-15T10:24:00Z"),
//     updatedAt: new Date("2024-01-15T10:24:00Z")
//   }

// {
//     id: "a912cd82-8f31-47dc-88c8-3a34d1cce0b9",
//     clientId: "e88d01fa-55b6-4d57-a9d3-408c27fe12d4",
//     businessId: "cd09fea2-7e3b-42ec-80f5-af942b710c61",
//     rating: 3,
//     comment: "Service was okay, but the wait time was longer than expected.",
//     reply: null,
//     replyTime: null,
//     likes: 4,
//     clientName: "Maria Gomez",
//     clientProfileImage: "https://example.com/images/maria.jpg",
//     service: "Hair Styling",
//     clientType: ClientType.REGULAR,
//     createdAt: new Date("2024-02-02T14:58:00Z"),
//     updatedAt: new Date("2024-02-02T14:58:00Z")
//   }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../business/entities/review.entity';
import { ClientType } from '../../business/entities/client-settings.entity';

@Injectable()
export class ReviewSeed {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async run() {
    console.log('Seeding reviews...');

    const reviews = [
      {
        clientId: '5fdc9038-346a-40b6-a72c-269df301f626',
        ownerId: '2e093365-18cb-490c-8aad-23cec296135b',
        businessId: null,
        rating: 4.1,
        comment:
          'Amazing service! The staff were friendly and the process was fast. Definitely recommend.',
        reply: null,
        replyTime: null,
        likes: 12,
        clientName: 'Gbenga Alonge',
        clientProfileImage:
          'https://res.cloudinary.com/dwfnwg3jo/image/upload/v1762808294/KHS/business/2e093365-18cb-490c-8aad-23cec296135b/clients/Gbenga-Alonge/lkrukjjzek2tih64q8o21uo8x.png',
        service: 'Facial',
        clientType: ClientType.NEW,
        createdAt: new Date('2024-01-15T10:24:00Z'),
        updatedAt: new Date('2024-01-15T10:24:00Z'),
      },
      {
        clientId: '5fdc9038-346a-40b6-a72c-269df301f626',
        ownerId: '2e093365-18cb-490c-8aad-23cec296135b',
        businessId: null,
        rating: 3.9,
        comment:
          'Service was okay, but the wait time this period was longer than expected.',
        reply: null,
        replyTime: null,
        likes: 6,
        clientName: 'Gbenga Alonge',
        clientProfileImage:
          'https://res.cloudinary.com/dwfnwg3jo/image/upload/v1762808294/KHS/business/2e093365-18cb-490c-8aad-23cec296135b/clients/Gbenga-Alonge/lkrukjjzek2tih64q8o21uo8x.png',
        service: 'Hair Styling',
        clientType: ClientType.NEW,
        createdAt: new Date('2024-02-02T14:58:00Z'),
        updatedAt: new Date('2024-02-02T14:58:00Z'),
      },
    ];

    for (const review of reviews) {
      await this.reviewRepository.save(this.reviewRepository.create(review));
    }

    console.log(`✅ Seeded ${reviews.length} reviews`);
  }
}
