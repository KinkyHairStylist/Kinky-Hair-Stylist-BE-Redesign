// src/referral/referral.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './referral.entity';
import { User } from '../user/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // Generate unique referral code
  generateReferralCode(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Ensure user has a referral code
  async ensureReferralCode(userId: string): Promise<string> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.referralCode) {
      user.referralCode = this.generateReferralCode();
      await this.userRepository.save(user);
    }

    return user.referralCode;
  }

  // Get referral dashboard data
  async getReferralDashboard(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all referrals made by this user
    const referrals = await this.referralRepository.find({
      where: { referrer: { id: userId } },
      relations: ['referee']
    });

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === 'completed').length;
    const totalEarnings = user.totalEarnings;
    const pendingRewards = user.pendingRewards;

    // Get recent referrals
    const recentReferrals = referrals.slice(0, 10).map(referral => ({
      id: referral.id.toString(),
      name: referral.referee?.firstName || 'Anonymous',
      date: referral.createdAt.toISOString().split('T')[0],
      amount: referral.rewardAmount,
      status: referral.status
    }));

    return {
      totalReferrals,
      activeReferrals,
      totalEarnings,
      pendingRewards,
      recentReferrals
    };
  }

  // Create referral when new user signs up with referral code
  async createReferral(referralCode: string, newUserId: string): Promise<void> {
    const referrer = await this.userRepository.findOne({ where: { referralCode } });
    if (!referrer) {
      return; // Invalid referral code, just proceed with signup
    }

    const referee = await this.userRepository.findOne({ where: { id: newUserId } });
    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const referral = this.referralRepository.create({
      referrer: referrer,
      referee: referee,
      status: 'pending',
      rewardAmount: 30.00 // AUD 30 reward
    });

    await this.referralRepository.save(referral);

    // Update referrer's pending rewards
    referrer.pendingRewards += 30.00;
    await this.userRepository.save(referrer);
  }

  // Complete referral when referee makes first booking
  async completeReferral(refereeId: string): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { referee: { id: refereeId }, status: 'pending' },
      relations: ['referrer']
    });

    if (!referral) {
      return;
    }

    // Update referral status
    referral.status = 'completed';
    referral.completedAt = new Date();
    await this.referralRepository.save(referral);

    // Update user earnings
    const referrer = referral.referrer;
    referrer.totalEarnings += referral.rewardAmount;
    referrer.pendingRewards -= referral.rewardAmount;
    await this.userRepository.save(referrer);
  }

  // Get referral link
  async getReferralLink(userId: string): Promise<string> {
    const referralCode = await this.ensureReferralCode(userId);
    return `${process.env.FRONTEND_URL}/signup?ref=${referralCode}`;
  }
}
