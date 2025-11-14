import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../middlewares/guards/jwt-auth.guard';
import { User } from 'src/all_user_entities/user.entity';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dtos/requests/CreateBusinessDto';
import { BookingPoliciesData, BusinessServiceData } from '../types/constants';
import { Public } from '../middlewares/public.decorator';
import {GetAvailableSlotsDto} from "../dtos/requests/GetAvailableSlotsDto";
import {CreateBlockedTimeDto} from "../dtos/requests/CreateBlockedTimeDto";
import {CreateServiceDto} from "../dtos/requests/CreateServiceDto";
import {CreateStaffDto} from "../dtos/requests/AddStaffDto";

interface RequestWithUser extends Request {
  user: User;
}

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('getBookings')
  async getBookings(@Req() req: RequestWithUser) {
    const user = req.user.id;
    return this.businessService.getBookings(user);
  }

  // @Post('createBooking')

  @Post('available-slots/:businessId')
  async getAvailableSlots(
      @Param('businessId') businessId: string,
      @Body() body: GetAvailableSlotsDto,
  ) {
    if (!body?.date) throw new BadRequestException('date is required in body (YYYY-MM-DD)');
    // const slots = await this.businessService.getAvailableSlots(businessId, body.date);
    // return { date: body.date, slots };
  }

  @Get('getBooking/:id')
  async getBooking(@Param('id') id: string) {
    return this.businessService.getBooking(id);
  }

  @Post('deleteBlockedSlot/:id')
  async deleteBlockedSlot(
      @Param('id') id: string,
  ) {

    return this.businessService.deleteBlockedSlot( id);
  }

  @Post('addStaff')
  async addStaff(@Req() req:RequestWithUser, @Body() body: CreateStaffDto) {
    const userMail = req.user.email;
    return this.businessService.addStaff(userMail,body)
  }

  @Get('getBlockedSlots')
  async getBlockedSlots(@Req() req:RequestWithUser) {
    const user = req.user.email;
    return this.businessService.getBlockedSlots(user);
  }

  @Post('acceptBooking/:id')
  async acceptBooking(@Param('id') id: string) {
    return this.businessService.acceptBooking(id);
  }

  @Post('rejectBooking/:id')
  async rejectBooking(@Param('id') id: string) {
    return this.businessService.rejectBooking(id);
  }

  @Post('rescheduleBooking')
  async rescheduleBooking(@Body() body:{id:string,reason:string,date:string,time:string}) {
    return this.businessService.rescheduleBooking(body);
  }

  @Post('create')
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
  @Get('/business/list-services')
  @HttpCode(HttpStatus.OK)
  getServices(): BusinessServiceData[] {
    return this.businessService.getServices();
  }

  @Public()
  @Get('/business/list-booking-policies')
  @HttpCode(HttpStatus.OK)
  getBookingPoliciesConfigs(): BookingPoliciesData[] {
    return this.businessService.getBookingPoliciesConfiguration();
  }

  @Get('/ping')
  ping() {
    console.log('yo');
    return 'server is live';
  }
}
