import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { SubscribeMembershipDto } from '../dtos/subscribe-membership.dto';
import { MembershipService } from '../services/membership-subscription.service';

@ApiTags('Membership')
@Controller('membership')
export class MembershipSubscriptionController {
  constructor(
    private readonly MembershipService: MembershipService,
  ) {}

  @Post('/user/subscription/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[3] Subscribe to Membership API' })
  @ApiResponse({
    status: 201,
    description: 'Subscribes the authenticated user to a membership tier',
    schema: {
      example: {
        message: 'Subscribed successfully to Luxury Experience',
        subscription: {
          id: 'uuid',
          userId: 'uuid',
          tier: {
            id: 'uuid',
            name: 'Luxury Experience',
            availablePrice: 30000,
          },
          status: 'active',
          startDate: '2025-10-24T00:00:00.000Z',
          endDate: '2025-11-23T00:00:00.000Z',
          remainingSessions: 10,
        },
        success: true,
      },
    },
  })
  async subscribe(@Req() req, @Body() dto: SubscribeMembershipDto) {
    const user = req.user;
    return await this.MembershipService.subscribe(user, dto);
  }


  @Get('/user/subscription/my-subscription')
  @ApiOperation({ summary: '[3] Get User Subscription' })
  @ApiResponse({ status: 200, description: 'Fetch current user membership info' })
  async getUserSubscription(@Req() req) {
    const userId = req.user.id;
    return this.MembershipService.getUserSubscription(userId);
  }

  // Cancel Membership
  @Post('/user/subscription/cancel')
  @ApiOperation({ summary: '[4] Cancel Membership' })
  @ApiResponse({ status: 200, description: 'Cancel the current user membership' })
  async cancelMembership(@Req() req) {
    const userId = req.user.id;
    return this.MembershipService.cancelMembership(userId);
  }

  // Upgrade Membership
  @Post('/user/subscription/upgrade')
  @ApiOperation({ summary: '[5] Upgrade Membership' })
  @ApiResponse({ status: 200, description: 'Upgrade to next available membership tier' })
  async upgradeMembership(@Req() req) {
    const userId = req.user.id;
    return this.MembershipService.upgradeMembership(userId);
  }
}
