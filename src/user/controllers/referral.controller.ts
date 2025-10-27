import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { ReferralService } from '../services/referral.service';

@ApiTags('Referrals')
@ApiBearerAuth() // Shows lock icon & enables JWT input in Swagger
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/user/stats')
  @ApiOperation({
    summary: 'Get referral and booking statistics for the logged-in user',
    description:
      'Retrieves total referrals, successful bookings, total earnings, and pending earnings for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Referral statistics successfully retrieved.',
    schema: {
      example: {
        totalReferrals: 5,
        successfulBookings: 3,
        totalEarnings: 60,
        pendingEarnings: 40,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReferralStats(@Req() req) {
    const userId = req.user.sub; // Extracted from JWT payload
    return this.referralService.getReferralStats(userId);
  }

  @Get('/user/my-referrals')
  @ApiOperation({ summary: 'Get all referrals for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of referrals retrieved successfully' })
  async getMyReferrals(@Req() req) {
    const userId = req.user.sub; // comes from JWT payload
    return await this.referralService.getUserReferrals(userId);
  }
}

