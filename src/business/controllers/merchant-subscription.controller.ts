import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Role } from 'src/middleware/role.enum';
import { Roles } from 'src/middleware/roles.decorator';
import { Business } from '../entities/business.entity';
import { MerchantSubscriptionService } from '../services/merchant-subscription.service';
import { PlatformSettingsService } from 'src/admin/platform-settings/platform-settings.service';

@ApiTags('Merchant Subscription')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Merchant, Role.Staff)
@Controller('merchant-subscription')
export class MerchantSubscriptionController {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly merchantSubscriptionService: MerchantSubscriptionService,
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  private async getOwnedBusiness(req: any): Promise<Business> {
    const ownerId = req.user.id || req.user.sub;
    if (!ownerId) throw new BadRequestException('User not found on request');
    const business = await this.businessRepo.findOne({ where: { ownerId } });
    if (!business) throw new BadRequestException('No business found for this user');
    return business;
  }

  // Issues a SetupIntent client_secret for the frontend to collect a card
  // via Stripe Elements — collecting the card itself is out of scope here.
  @Post('setup-intent')
  async createSetupIntent(@Request() req) {
    const business = await this.getOwnedBusiness(req);
    const setupIntent = await this.merchantSubscriptionService.createSetupIntentForBusiness(
      business.id,
    );
    return { clientSecret: setupIntent.client_secret };
  }

  @Post('subscribe')
  async subscribe(@Request() req, @Body() body: { paymentMethodId: string }) {
    const business = await this.getOwnedBusiness(req);
    const payments = await this.platformSettingsService.getPayments();
    const priceId = payments.subscriptionPrices?.[business.planTier]?.priceId;
    if (!priceId) {
      throw new BadRequestException(
        `No Stripe price configured for tier ${business.planTier} — an admin must run the subscription-prices bootstrap script first.`,
      );
    }

    return this.merchantSubscriptionService.attachPaymentMethodAndSubscribe(
      business.id,
      body.paymentMethodId,
      priceId,
    );
  }
}
