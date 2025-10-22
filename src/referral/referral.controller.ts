// src/referral/referral.controller.ts

import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { Request } from 'express';

@Controller('api/referrals')
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    // In real app, get userId from session or JWT
    const userId = (req.session?.userId || '1').toString(); // Fallback to user ID "1" for demo
    return this.referralService.getReferralDashboard(userId);
  }

  @Get('link')
  async getReferralLink(@Req() req: Request) {
    const userId = (req.session?.userId || '1').toString();
    const link = await this.referralService.getReferralLink(userId);
    return { referralLink: link };
  }

  @Post('complete')
  async completeReferral(@Body('refereeId') refereeId: string) {
    await this.referralService.completeReferral(refereeId);
    return { success: true, message: 'Referral completed successfully' };
  }
}
