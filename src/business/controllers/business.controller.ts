import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../middlewares/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dtos/requests/CreateBusinessDto';
import { BookingPoliciesData, BusinessServiceData } from '../types/constants';
import { Public } from '../middlewares/public.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
    @Req() req: RequestWithUser,
  ) {
    const owner = req.user;

    const business = await this.businessService.create(
      createBusinessDto,
      owner,
    );

    return {
      message: 'Business created successfully.',
      businessId: business.id,
      businessName: business.businessName,
    };
  }

  @Public()
  @Get('/list-services')
  @HttpCode(HttpStatus.OK)
  getServices(): BusinessServiceData[] {
    return this.businessService.getServices();
  }

  @Public()
  @Get('/list-booking-policies')
  @HttpCode(HttpStatus.OK)
  getBookingPoliciesConfigs(): BookingPoliciesData[] {
    return this.businessService.getBookingPoliciesConfiguration();
  }
}
