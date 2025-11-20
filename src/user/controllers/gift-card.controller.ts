import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { GetUser } from 'src/middleware/get-user.decorator';
import { User } from 'src/all_user_entities/user.entity';
import { GiftCardService } from '../services/gift-card.service';
import {
  PurchaseBusinessGiftCardDto,
  ValidateGiftCardDto,
  RedeemGiftCardDto,
} from '../dtos/create-gift-card.dto';
import { Roles } from 'src/middleware/roles.decorator';
import { Role } from 'src/middleware/role.enum';
import { RolesGuard } from 'src/middleware/roles.guard';

@ApiTags('Customer Card and Gift Cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client)
@Controller('users/gift-cards')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  /**
   * Purchase an available gift card
   * Customers do NOT generate gift cards — they can only purchase from the business catalog.
   */
  @Post('purchase')
  @ApiOperation({
    summary: 'Purchase a gift card from available business gift cards',
    description:
      'Customers can only purchase gift cards marked as AVAILABLE. After purchase the gift card will change to "purchased".',
  })
  @ApiResponse({
    status: 201,
    description: 'Gift card purchased successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Gift card not available or already purchased.',
  })
  async purchaseGiftCard(
    @Body() dto: PurchaseBusinessGiftCardDto,
    @GetUser() sender: User,
  ) {
    return await this.giftCardService.purchaseGiftCard(dto, sender);
  }

  /**
   * Validate a gift card by its code
   */
  @Post('validate')
  @ApiOperation({ summary: 'Validate a gift card using its unique code' })
  @ApiResponse({ status: 200, description: 'Gift card validity checked' })
  async validateGiftCard(@Body() dto: ValidateGiftCardDto) {
    return this.giftCardService.validateGiftCard(dto);
  }

  /**
   * Redeem a valid gift card
   */
  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a gift card using its unique code' })
  @ApiResponse({ status: 200, description: 'Gift card redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Gift card already used or invalid' })
  async redeemGiftCard(
    @Body() dto: RedeemGiftCardDto,
    @GetUser() user: User,
  ) {
    return this.giftCardService.redeemGiftCard(dto, user);
  }

  /**
   * Gift card stats for the authenticated user
   */
  @Get('stats')
  @ApiOperation({
    summary:
      'Get gift card statistics for the authenticated user (total sent, active count, used count)',
  })
  async getGiftCardStats(@GetUser() user: User) {
    return this.giftCardService.getGiftCardStatsByUser(user);
  }

  /**
   * Fetch all available gift cards (for purchase)
   */
  @Get()
  @ApiOperation({
    summary: 'List all available gift cards for purchase',
    description:
      'Only returns gift cards with soldStatus = AVAILABLE in BusinessGiftCard list.',
  })
  async getAllGiftCards() {
    return await this.giftCardService.getAllAvailableBusinessGiftCards();
  }
}
