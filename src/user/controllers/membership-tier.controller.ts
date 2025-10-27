import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MembershipTierService } from '../services/membership-tier.service';

@ApiTags('Membership')
@Controller('membership')
export class MembershipTierController {
  constructor(private readonly membershipTierService: MembershipTierService) {}

  @Get('/user/tiers')
  @ApiOperation({ summary: '[2] Get Membership Tiers' })
  @ApiResponse({
    status: 200,
    description: 'Returns all available membership tiers with price and session info',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Luxury Experience',
          description: 'Exclusive VIP service',
          initialPrice: 40000,
          availablePrice: 30000,
          durationDays: 30,
          session: 10,
          isRecommended: false,
          createdAt: '2025-10-24T10:00:00Z',
        },
      ],
    },
  })
  async getAllTiers() {
    return await this.membershipTierService.getAllTiers();
  }
}