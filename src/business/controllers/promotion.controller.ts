import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { PromotionService } from '../services/promotion.service';
import { SendPromotionDto } from '../dtos/requests/PromotionDto';

@Controller('promotions')
// @UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('/send')
  async sendPromotion(@Request() req, @Body() reminderData: SendPromotionDto) {
    const result = await this.promotionService.sendPromotion(reminderData);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
