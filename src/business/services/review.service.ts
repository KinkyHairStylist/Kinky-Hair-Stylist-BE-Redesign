import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { ApiResponse } from '../types/client.types';
import { ClientSchema } from '../entities/client.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,

    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,
  ) {}

  async getClientReviewList(
    ownerId: string,
    clientId: string,
  ): Promise<ApiResponse<any>> {
    try {
      // const business = await this.businessRepo.findOne({
      //   where: { owner: { id: ownerId } },
      // });
      // if (!business) {
      //   return {
      //     success: false,
      //     error: 'Business not found',
      //     message: 'No business found for this user',
      //   };
      // }

      // if (!id) {
      //   return {
      //     success: false,
      //     error: 'Settings ID required',
      //     message: 'Settings ID required',
      //   };
      // }

      // Verify client belongs to owner
      const client = await this.clientRepo.findOne({
        where: {
          id: clientId,
          ownerId: ownerId,
          isActive: true,
        },
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      const clientReviews = await this.reviewRepo.find({
        where: { clientId, ownerId },
      });

      if (clientReviews.length === 0) {
        return {
          success: true,
          data: null,
          message: 'Client has no reviews yet',
        };
      }

      return {
        success: true,
        data: {},
        message: 'Client reviews retrieved successfully',
      };
    } catch (error) {
      console.log('Get clients review error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch client reviews',
      };
    }
  }
}
