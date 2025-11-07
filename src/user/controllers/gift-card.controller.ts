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
  CustomerCreateGiftCardDto,
  ValidateGiftCardDto,
  RedeemGiftCardDto,
} from '../dtos/create-gift-card.dto';

@ApiTags('Customer Card and Gift Cards')
@ApiBearerAuth('access-token')
@Controller('users/gift-cards')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Purchase a new gift card' })
  async purchaseGiftCard(
    @Body() dto: CustomerCreateGiftCardDto,
    @GetUser() sender: User,
  ) {
    return await this.giftCardService.createGiftCard(dto, sender);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a gift card using its unique code' })
  @ApiResponse({ status: 200, description: 'Gift card validity checked' })
  async validateGiftCard(@Body() dto: ValidateGiftCardDto) {
    return this.giftCardService.validateGiftCard(dto);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Redeem a gift card using its unique code' })
  @ApiResponse({ status: 200, description: 'Gift card redeemed successfully' })
  async redeemGiftCard(
    @Body() dto: RedeemGiftCardDto,
    @GetUser() user: User,
  ) {
    return this.giftCardService.redeemGiftCard(dto, user);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get gift card statistics for the authenticated user (total sent, active count, used count)',
  })
  async getGiftCardStats(@GetUser() user: User) {
    return this.giftCardService.getGiftCardStatsByUser(user);
  }

  @Get()
  async getAllGiftCards() {
    return await this.giftCardService.getAllGiftCards();
  }
}
