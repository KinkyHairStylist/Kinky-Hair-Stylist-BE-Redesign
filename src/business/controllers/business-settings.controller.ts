import {
  BadRequestException,
  Controller,
  Get,
  Request,
  HttpStatus,
  HttpException,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { BusinessSettingsService } from '../services/business-settings.service';
import {
  UpdateBusinessContactDto,
  UpdateBusinessLocationDto,
  UpdateBusinessNameDto,
  UpdateBusinessProfileDto,
} from '../dtos/requests/BusinessSettingsDto';

@ApiTags('business-settings')
@Controller('business-settings')
export class BusinessSettingsController {
  constructor(
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private readonly businessService: BusinessSettingsService,
  ) {}

  @Get('/profile')
  async getBusinessProfile(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const business = await this.businessRepository.findOne({
        where: { ownerId },
      });

      if (!business) {
        throw new BadRequestException(`No business found for this user`);
      }

      return {
        success: true,
        data: business,
        message: 'Business fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch business',
      };
    }
  }

  @Patch(':businessId/name-description')
  @ApiOperation({ summary: 'Update business name and description' })
  @ApiResponse({
    status: 200,
    description: 'Business name and description updated successfully',
    type: Business,
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 400, description: 'Bad request or unauthorized' })
  async updateBusinessNameAndDescription(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() updateDto: UpdateBusinessNameDto,
  ) {
    try {
      const ownerId = req.user.sub || req.user.userId;
      const business =
        await this.businessService.updateBusinessNameAndDescription(
          businessId,
          ownerId,
          updateDto,
        );

      return {
        success: true,
        data: business,
        message: 'Business updated sucessfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to update business',
      };
    }
  }

  @Patch(':businessId/contact')
  @ApiOperation({ summary: 'Update business contact information' })
  @ApiResponse({
    status: 200,
    description: 'Business contact updated successfully',
    type: Business,
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 400, description: 'Bad request or unauthorized' })
  async updateBusinessContact(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() updateDto: UpdateBusinessContactDto,
  ): Promise<Business> {
    const ownerId = req.user.id;
    return this.businessService.updateBusinessContact(
      businessId,
      ownerId,
      updateDto,
    );
  }

  @Patch(':businessId/location')
  @ApiOperation({ summary: 'Update business location' })
  @ApiResponse({
    status: 200,
    description: 'Business location updated successfully',
    type: Business,
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 400, description: 'Bad request or unauthorized' })
  async updateBusinessLocation(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() updateDto: UpdateBusinessLocationDto,
  ): Promise<Business> {
    const ownerId = req.user.id;
    return this.businessService.updateBusinessLocation(
      businessId,
      ownerId,
      updateDto,
    );
  }

  @Patch(':businessId/profile')
  @ApiOperation({ summary: 'Edit complete business profile' })
  @ApiResponse({
    status: 200,
    description: 'Business profile updated successfully',
    type: Business,
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 400, description: 'Bad request or unauthorized' })
  async editBusinessProfile(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() updateDto: UpdateBusinessProfileDto,
  ): Promise<Business> {
    const ownerId = req.user.id;
    return this.businessService.editBusinessProfile(
      businessId,
      ownerId,
      updateDto,
    );
  }
}
