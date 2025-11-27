import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/all_user_entities/user.entity';
import { Gender } from 'src/business/types/constants';

@Injectable()
export class UserSeed {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async run() {
    console.log('Seeding users...');

    const users = [
      {
        email: 'john.doe@example.com',
        password: '$2b$10$XQjZ5KxZJxYxZxZxZxZxZeU9', // hashed "password123"
        firstName: 'John',
        surname: 'Doe',
        phoneNumber: '+2348012345678',
        gender: Gender.MALE,
        suspensionHistory: '.',
        isSuspended: false,
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
        resetCode: null,
        resetCodeExpires: null,
        booking: 5,
        spent: 250000,
        longitude: 3379200,
        latitude: 6524400,
        activity: '2 hours ago',
        totalEarnings: 50000,
        availableEarnings: 30000,
        referralCode: 'JOHN2024',
      },
      {
        email: 'jane.smith@example.com',
        password: '$2b$10$XQjZ5KxZJxYxZxZxZxZxZeU9',
        firstName: 'Jane',
        surname: 'Smith',
        phoneNumber: '+2348023456789',
        gender: Gender.FEMALE,
        suspensionHistory: '.',
        isSuspended: false,
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
        resetCode: null,
        resetCodeExpires: null,
        booking: 12,
        spent: 450000,
        longitude: 3389500,
        latitude: 6455000,
        activity: '30 minutes ago',
        totalEarnings: 120000,
        availableEarnings: 80000,
        referralCode: 'JANE2024',
      },
      {
        email: 'alex.johnson@example.com',
        password: '$2b$10$XQjZ5KxZJxYxZxZxZxZxZeU9',
        firstName: 'Alex',
        surname: 'Johnson',
        phoneNumber: '+2348034567890',
        gender: Gender.CUSTOM,
        suspensionHistory: '.',
        isSuspended: false,
        isVerified: false,
        verificationCode: '123456',
        verificationExpires: new Date(Date.now() + 3600000), // 1 hour from now
        resetCode: null,
        resetCodeExpires: null,
        booking: 0,
        spent: 0,
        longitude: 3400000,
        latitude: 6500000,
        activity: 'just now',
        totalEarnings: 0,
        availableEarnings: 0,
        referralCode: 'ALEX2024',
      },
      {
        email: 'sarah.williams@example.com',
        password: '$2b$10$XQjZ5KxZJxYxZxZxZxZxZeU9',
        firstName: 'Sarah',
        surname: 'Williams',
        phoneNumber: '+2348045678901',
        gender: Gender.FEMALE,
        suspensionHistory: 'Suspended on 2024-01-15 for policy violation.',
        isSuspended: true,
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
        resetCode: null,
        resetCodeExpires: null,
        booking: 3,
        spent: 150000,
        longitude: 3350000,
        latitude: 6600000,
        activity: '1 day ago',
        totalEarnings: 25000,
        availableEarnings: 0,
        referralCode: 'SARAH2024',
      },
      {
        email: 'mike.brown@example.com',
        password: '$2b$10$XQjZ5KxZJxYxZxZxZxZxZeU9',
        firstName: 'Mike',
        surname: 'Brown',
        phoneNumber: '+2348056789012',
        gender: Gender.MALE,
        suspensionHistory: '.',
        isSuspended: false,
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
        resetCode: 'RST789',
        resetCodeExpires: new Date(Date.now() + 1800000), // 30 minutes from now
        booking: 8,
        spent: 320000,
        longitude: 3360000,
        latitude: 6480000,
        activity: '5 hours ago',
        totalEarnings: 75000,
        availableEarnings: 50000,
        referralCode: 'MIKE2024',
      },
    ];

    for (const user of users) {
      await this.userRepository.save(this.userRepository.create(user));
    }

    console.log(`✅ Seeded ${users.length} users`);
  }
}
