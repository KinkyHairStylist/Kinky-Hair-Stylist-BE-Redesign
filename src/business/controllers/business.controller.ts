import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus, Param,
  Post, Query,
  Req, UnauthorizedException,
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
import {EditStaffDto} from "../dtos/requests/EditStaffDto";

interface RequestWithUser extends Request {
  user: User;
}

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}


  @Post('getBookings')
  async getBookings(@Req() req:RequestWithUser) {
    const user = req.user.id;
    return this.businessService.getBookings(user);
  }

  @Post('deactivateStaff/:id')
  async deactivateStaff(@Param('id') id: string){
    return this.businessService.deactivateStaff(id);
  }

  @Post('completeBooking/:id')
  async completeBooking(@Param('id') id: string) {
    return this.businessService.completeBooking(id);
  }

  @Post('getRescheduledBookings')
  async getRescheduledBookings(@Req() req:RequestWithUser) {
    const user = req.user.id;
    return this.businessService.getRescheduledBookings(user);
  }

  @Get('available-slots')
  async getAvailableSlots(
      @Req() req:RequestWithUser,
      @Query('date') date: string,
  ) {

    const userMail = req.user.email;

    if (!date) {
      throw new BadRequestException("Date query parameter is required");
    }

    return await this.businessService.getAvailableSlotsForDate(userMail, date);
  }

  @Post('rescheduleBooking')
  async rescheduleBooking(
      @Body() body: { id: string; reason: string; date: string; time: string },
  ) {
    return await this.businessService.rescheduleBooking(body);
  }

  @Post('blockTime')
  async createBlockedTime(
      @Body() body: CreateBlockedTimeDto,
      @Req() req:RequestWithUser,
  ) {
    body.ownerMail = req.user.email
    return this.businessService.createBlockedTime(body);
  }

  @Post('editBlockTime/:id')
  async editBlockedTime(
      @Param('id') id: string,
      @Body() body: CreateBlockedTimeDto,
      @Req() req:RequestWithUser,
  ) {
    body.ownerMail = req.user.email
    console.log(body.date)
    return this.businessService.editBlockedTime(id, body);
  }

  @Get('getAdvertisementPlans')
  async getAdvertisementPlans(){
    return this.businessService.getAdvertisementPlans();
  }


  @Get('getTeamMembers')
  async getTeamMembers(@Req() req:RequestWithUser) {
    const userMail = req.user.email;
    return this.businessService.getTeamMembers(userMail)
  }

  @Get('getServices')
  async getBusinessServices(@Req() req:RequestWithUser) {
    const userMail = req.user.email;
    console.log(await this.businessService.getBusinessServices(userMail))
    return this.businessService.getBusinessServices(userMail)
  }

  @Post('createService')
  async createService(@Req() req:RequestWithUser, @Body() body: CreateServiceDto) {
    body.userMail = req.user.email;
    return this.businessService.createService(body);
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

  @Post('editStaff/:staffId')
  async editStaff(
      @Param('staffId') staffId: string,
      @Body() body: EditStaffDto
  ) {
    return this.businessService.editStaff(staffId, body);
  }


  @Post('acceptBooking/:id')
  async acceptBooking(@Param('id') id: string) {
    return this.businessService.acceptBooking(id);
  }

  @Post('rejectBooking/:id')
  async rejectBooking(@Param('id') id: string) {
    return this.businessService.rejectBooking(id);
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
  ping(){
    console.log("yo")
    return "server is live"
  }
}
