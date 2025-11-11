import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Request,
} from '@nestjs/common';
import { ReviewService } from '../services/review.service';

@Controller('reviews')
// @UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('/client/:clientId')
  async getClients(@Request() req, @Param('clientId') clientId: string) {
    const ownerId = req.user.sub || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.reviewService.getClientReviewList(
      clientId,
      ownerId,
    );
  }
}
