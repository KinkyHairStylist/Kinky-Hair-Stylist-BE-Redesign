import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Roles } from 'src/middleware/roles.decorator';
import { Role } from 'src/middleware/role.enum';
import { Business } from '../entities/business.entity';
import { MerchantMembershipService } from '../services/merchant-membership.service';
import { CreateMerchantMembershipPackageDto } from '../dtos/requests/MerchantMembershipDto';

@ApiTags('Merchant Membership Packages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Merchant, Role.Staff)
@Controller('merchant-memberships')
export class MerchantMembershipController {
  constructor(
    private readonly membershipService: MerchantMembershipService,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  private async getOwnedBusiness(req: any): Promise<Business> {
    const ownerId = req.user.id || req.user.sub;
    if (!ownerId) throw new BadRequestException('User not found on request');
    const business = await this.businessRepo.findOne({ where: { ownerId } });
    if (!business) throw new BadRequestException('No business found for this user');
    return business;
  }

  @Post()
  @ApiOperation({ summary: 'Create a membership package for the merchant\'s business' })
  async create(@Request() req, @Body() dto: CreateMerchantMembershipPackageDto) {
    const business = await this.getOwnedBusiness(req);
    return this.membershipService.create(dto, business.id);
  }

  @Get()
  @ApiOperation({ summary: 'List membership packages for the merchant\'s business' })
  async list(@Request() req) {
    const business = await this.getOwnedBusiness(req);
    return this.membershipService.listForBusiness(business.id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a membership package' })
  async deactivate(@Request() req, @Param('id') id: string) {
    const business = await this.getOwnedBusiness(req);
    return this.membershipService.deactivate(id, business.id);
  }
}
