// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { CompanySize, Gender } from 'src/business/types/constants';
// import {
//   Business,
//   BusinessStatus,
// } from 'src/business/entities/business.entity';
// import { BookingDay } from 'src/business/entities/booking-day.entity';

// @Injectable()
// export class BusinessSeed {
//   constructor(
//     @InjectRepository(Business)
//     private businessRepository: Repository<Business>,
//   ) {}

//   async run() {
//     console.log('Seeding business...');

//     const business = {
//       id: '8f1d4c2b-9c3e-4a4a-9120-4b97a6aa8c11',
//       businessName: 'BrightPath Consulting',
//       description:
//         'A professional consulting service helping small businesses grow.',

//       owner: {
//         email: 'alex.johnson@example.com',
//         password:
//           '$2b$10$0hEQLQCuAhr2nIgWy.g7B.SX4u9OTB7iG0i.aoGnUqWvI/fYa98qS',
//         firstName: 'Alex',
//         surname: 'Johnson',
//         phoneNumber: '+2348034567890',
//         gender: Gender.CUSTOM,
//         suspensionHistory: '.',
//         isSuspended: false,
//         isVerified: true,
//         verificationCode: '123456',
//         verificationExpires: new Date(Date.now() + 3600000),
//         resetCode: null,
//         resetCodeExpires: null,
//         booking: 0,
//         spent: 0,
//         longitude: 3400000,
//         latitude: 6500000,
//         activity: 'just now',
//         totalEarnings: 0,
//         availableEarnings: 0,
//         referralCode: 'ALEX2024',
//         id: '19dadfed-a6b0-4d02-819e-b1bc5c7a18da',
//         businesses: [],
//       },

//       ownerId: '19dadfed-a6b0-4d02-819e-b1bc5c7a18da',
//       ownerName: 'Alex Johnson',
//       ownerEmail: 'alex.johnson@example.com',
//       ownerPhone: '+2348034567890',

//       primaryAudience: 'Small businesses',

//       appointments: [],

//       services: ['Consulting', 'Strategy', 'Coaching'],
//       category: 'Business Consulting',
//       location: 'Lagos, Nigeria',

//       bookingPolicies: {
//         id: '47f0f696-e41c-4ddf-a84a-e7db824f3cf7',

//         minimumLeadTime: 60, // e.g., 1 hour notice
//         bufferTime: 15, // e.g., 15 min between bookings
//         cancellationWindow: 24, // 24 hours before appointment
//         requireDepositAmount: false,

//         business: null as any,
//       },

//       companySize: CompanySize.SMALL_TEAM,

//       bookingHours: [
//         {
//           id: 'dd47df0a-d36a-4d89-bae6-a2e8fb7c449b',
//           day: 'Monday',
//           startTime: '09:00',
//           endTime: '17:00',
//           business: null as any,
//           isOpen: true,
//         } as BookingDay,
//       ],

//       howDidYouHear: 'Online Search',
//       status: BusinessStatus.PENDING,

//       revenue: 0,
//       bookings: 0,
//       staff: 2,
//       plan: 'Free',

//       performance: {
//         rating: 0,
//         reviews: 0,
//         completionRate: 0,
//         avgResponseMins: 0,
//       },

//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     await this.businessRepository.save(
//       this.businessRepository.create(business),
//     );

//     console.log(`✅ Seeded  business`);
//   }
// }
