// src/membership/membership.controller.ts

import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { Request } from 'express';

@Controller('api/membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get('tiers')
  async getMembershipTiers() {
    return this.membershipService.getMembershipTiers();
  }

  @Post('subscribe')
  async subscribeToMembership(@Body('tierId') tierId: number, @Req() req: Request) {
    const userId = req.session?.userId || 1; // Fallback for demo
    return this.membershipService.subscribeToMembership(userId, tierId);
  }

  @Get('user')
  async getUserSubscription(@Req() req: Request) {
    const userId = req.session?.userId || 1;
    return this.membershipService.getUserSubscription(userId);
  }

  @Post('cancel')
  async cancelMembership(@Req() req: Request) {
    const userId = req.session?.userId || 1;
    await this.membershipService.cancelMembership(userId);
    return { success: true, message: 'Membership cancelled successfully' };
  }

  @Post('upgrade')
  async upgradeMembership(@Body('tierId') tierId: number, @Req() req: Request) {
    const userId = req.session?.userId || 1;
    return this.membershipService.upgradeMembership(userId, tierId);
  }
}