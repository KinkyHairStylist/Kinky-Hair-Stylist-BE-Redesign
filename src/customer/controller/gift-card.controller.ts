import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,

} from '@nestjs/common';
import { GiftCardService } from '../services/gift-card.service';
import { PaymentService } from '../services/payment.service';
import { GiftCardResponse } from '../dtos/response/gift-card.response';
import { GiftCardSummaryResponse } from '../dtos/response/gift-card-summary.response';
import { GiftCardTemplateResponse } from '../dtos/response/gift-card-template.response';
import { GiftCardMapper } from '../mapper/gift-card.mapper';
import { PurchaseGiftCardRequest } from '../dtos/request/purchase-gift-card.request';
import { RedeemGiftCardRequest } from '../dtos/request/redeem-gift-card-request';

@Controller('gift-cards')
export class GiftCardsController {
  constructor(
    private readonly giftCardService: GiftCardService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get()
  async getAllGiftCards(): Promise<GiftCardResponse[]> {
    const cards = await this.giftCardService.getAllGiftCards();
    return cards.map(card => GiftCardMapper.toGiftCardResponse(card));
  }

  @Get('active')
  async getActiveGiftCards(): Promise<GiftCardResponse[]> {
    const cards =   await this.giftCardService.getActiveGiftCards();
    return cards.map(card => GiftCardMapper.toGiftCardResponse(card));
  }

  @Get('summary')
  async getGiftCardSummary(): Promise<GiftCardSummaryResponse> {
    return this.giftCardService.getGiftCardSummary();
  }

  @Get('templates')
  async getGiftCardTemplates(): Promise<GiftCardTemplateResponse[]> {
    const templates = await this.giftCardService.getAvailableTemplates();
    return templates.map(template => GiftCardMapper.toGiftCardTemplateResponse(template));
  }

  @Post('purchase')
  async purchaseGiftCard(
    @Body() purchaseDto: PurchaseGiftCardRequest,
  ) {
    const paymentResult = await this.paymentService.processGiftCardPayment(purchaseDto);

    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

    // Ensure purchaseDto matches CreateGiftCardRequest structure
    const giftCard = await this.giftCardService.createGiftCard(purchaseDto);

    return {
      success: true,
      giftCard: GiftCardMapper.toGiftCardResponse(giftCard),
      transactionId: paymentResult.transactionId
    };
  }

  @Post('redeem')
  async redeemGiftCard(
    @Body() redeemDto: RedeemGiftCardRequest,
  ) {
    const giftCard = await this.giftCardService.redeemGiftCard(redeemDto);
    return {
      success: true,
      giftCard: GiftCardMapper.toGiftCardResponse(giftCard)
    };
  }

  @Post(':id/use')
  async useGiftCard(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    const giftCard = await this.giftCardService.useGiftCardAmount(id, amount);
    return {
      success: true,
      giftCard: GiftCardMapper.toGiftCardResponse(giftCard)
    };
  }

  @Post('apply-to-booking')
  async applyGiftCardToBooking(
    @Body() body: { giftCardCode: string; bookingAmount: number },
  ) {
    const { giftCardCode, bookingAmount } = body;

    if (!giftCardCode || bookingAmount == null || bookingAmount <= 0) {
      throw new HttpException(
        'Gift card code and valid booking amount are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.giftCardService.applyGiftCardToBooking(
        giftCardCode,
        bookingAmount,
      );

      return {
        success: true,
        message: 'Gift card applied successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
  @Get('validate/:code')
  async validateGiftCard(
    @Param('code') code: string
  ): Promise<{
    success: boolean;
    message: string;
    giftCard?: GiftCardResponse
  }> {
    try {
      const giftCard = await this.giftCardService.validateGiftCard(code);
      return {
        success: true,
        message: 'Gift card is valid',
        giftCard: GiftCardMapper.toGiftCardResponse(giftCard)
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
  @Get(':id')
  async getGiftCard(@Param('id') id: string): Promise<GiftCardResponse> {
    const cards = await this.giftCardService.getAllGiftCards();
    const card = cards.find(c => c.id === id);

    if (!card) {
      throw new Error('Gift card not found');
    }

    return GiftCardMapper.toGiftCardResponse(card);
  }
}
