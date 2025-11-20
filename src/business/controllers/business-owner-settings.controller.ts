import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { BusinessOwnerSettingsService } from '../services/business-owner-settings.service';
import { BusinessOwnerSettings } from '../entities/business-owner-settings.entity';
import { UpdateBusinessOwnerSettingsDto } from '../dtos/requests/BusinessOwnerSettingsDto';
import { UserService } from 'src/user/services/user.service';
import { Business } from '../entities/business.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('business-owner-settings')
export class BusinessOwnerSettingsController {
  constructor(
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,

    private readonly businessOwnerSettingsService: BusinessOwnerSettingsService,
    private readonly userService: UserService,
  ) {}

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // async create(
  //   @Body() createDto: CreateBusinessSettingsDto,
  // ): Promise<BusinessSettings> {
  //   return await this.businessSettingsService.create(createDto);
  // }

  @Get('owner')
  async getOwner(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const owner = await this.userService.findById(ownerId);

      if (!owner) {
        throw new BadRequestException(`Owner not found for this business`);
      }

      return {
        success: true,
        data: owner,
        message: 'Owner fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch owner',
      };
    }
  }

  @Get('/settings')
  async findByOwnerId(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result =
        await this.businessOwnerSettingsService.findByOwnerId(ownerId);

      return {
        success: true,
        data: result,
        message: 'Settings fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch settings',
      };
    }
  }

  @Put('/update')
  async updateSettings(
    @Request() req,
    @Body() updateDto: UpdateBusinessOwnerSettingsDto,
  ) {
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

      const result = await this.businessOwnerSettingsService.update(
        ownerId,
        business.id,
        updateDto,
      );

      return {
        success: true,
        data: result,
        message: 'Settings Updated',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch owner',
      };
    }
  }

  @Delete(':businessId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('businessId') businessId: string): Promise<void> {
    return await this.businessOwnerSettingsService.delete(businessId);
  }

  @Get(':businessId')
  async findOne(
    @Param('businessId') businessId: string,
  ): Promise<BusinessOwnerSettings> {
    return await this.businessOwnerSettingsService.findByBusinessId(businessId);
  }

  @Get()
  async findAll(): Promise<BusinessOwnerSettings[]> {
    return await this.businessOwnerSettingsService.findAll();
  }
}
