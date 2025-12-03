import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { CreateBlockedTimeDto } from '../dtos/requests/CreateBlockedTimeDto';
import { CreateServiceDto } from '../dtos/requests/CreateServiceDto';
import { CreateStaffDto } from '../dtos/requests/AddStaffDto';
import { EditStaffDto } from '../dtos/requests/EditStaffDto';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Role } from 'src/middleware/role.enum';
import { Roles } from 'src/middleware/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('getBookings')
  async getBookings(@Req() req: RequestWithUser) {
    const user = req.user.id;
    return this.businessService.getBookings(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('deactivateStaff/:id')
  async deactivateStaff(@Param('id') id: string) {
    return this.businessService.deactivateStaff(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('completeBooking/:id')
  async completeBooking(@Param('id') id: string) {
    return this.businessService.completeBooking(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('getRescheduledBookings')
  async getRescheduledBookings(@Req() req: RequestWithUser) {
    const user = req.user.id;
    return this.businessService.getRescheduledBookings(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Get('available-slots')
  async getAvailableSlots(
    @Req() req: RequestWithUser,
    @Query('date') date: string,
  ) {
    const userMail = req.user.email;

    if (!date) {
      throw new BadRequestException('Date query parameter is required');
    }

    return await this.businessService.getAvailableSlotsForDate(userMail, date);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('rescheduleBooking')
  async rescheduleBooking(
    @Body() body: { id: string; reason: string; date: string; time: string },
  ) {
    return await this.businessService.rescheduleBooking(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('blockTime')
  async createBlockedTime(
    @Body() body: CreateBlockedTimeDto,
    @Req() req: RequestWithUser,
  ) {
    body.ownerMail = req.user.email;
    return this.businessService.createBlockedTime(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('editBlockTime/:id')
  async editBlockedTime(
    @Param('id') id: string,
    @Body() body: CreateBlockedTimeDto,
    @Req() req: RequestWithUser,
  ) {
    body.ownerMail = req.user.email;
    return this.businessService.editBlockedTime(id, body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Get('getAdvertisementPlans')
  async getAdvertisementPlans() {
    return this.businessService.getAdvertisementPlans();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Get('getTeamMembers')
  async getTeamMembers(@Req() req: RequestWithUser) {
    const userMail = req.user.email;
    return this.businessService.getTeamMembers(userMail);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Get('getServices')
  async getBusinessServices(@Req() req: RequestWithUser) {
    const userMail = req.user.email;
    console.log(await this.businessService.getBusinessServices(userMail));
    return this.businessService.getBusinessServices(userMail);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('createService')
  async createService(
    @Req() req: RequestWithUser,
    @Body() body: CreateServiceDto,
  ) {
    body.userMail = req.user.email;
    return this.businessService.createService(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Get('getBooking/:id')
  async getBooking(@Param('id') id: string) {
    return this.businessService.getBooking(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('deleteBlockedSlot/:id')
  async deleteBlockedSlot(@Param('id') id: string) {
    return this.businessService.deleteBlockedSlot(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('addStaff')
  async addStaff(@Req() req: RequestWithUser, @Body() body: CreateStaffDto) {
    const userMail = req.user.email;
    return this.businessService.addStaff(userMail, body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Get('getBlockedSlots')
  async getBlockedSlots(@Req() req: RequestWithUser) {
    const user = req.user.email;
    return this.businessService.getBlockedSlots(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('editStaff/:staffId')
  async editStaff(
    @Param('staffId') staffId: string,
    @Body() body: EditStaffDto,
  ) {
    return this.businessService.editStaff(staffId, body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('acceptBooking/:id')
  async acceptBooking(@Param('id') id: string) {
    return this.businessService.acceptBooking(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Business, Role.SuperAdmin)
  @Post('rejectBooking/:id')
  async rejectBooking(@Param('id') id: string) {
    return this.businessService.rejectBooking(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
