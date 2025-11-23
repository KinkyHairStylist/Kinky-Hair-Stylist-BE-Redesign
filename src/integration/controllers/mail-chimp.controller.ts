import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { MailchimpService } from '../services/mailchimp.service';
import { UpdateBusinessOwnerSettingsDto } from 'src/business/dtos/requests/BusinessOwnerSettingsDto';

@Controller('mailchimp')
export class MailchimpController {
  constructor(private readonly mailchimpService: MailchimpService) {}

  @Post('connect/:businessId')
  async connect(
    @Request() req,
    @Param('businessId') businessId: string,
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
      const result = await this.mailchimpService.connect(
        ownerId,
        businessId,
        updateDto,
      );

      return {
        success: true,
        data: result,
        message: 'Mailchimp connected successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to cconnect Mailchimp',
      };
    }
  }

  @Post('sync/:appointmentId')
  async syncContact(@Param('appointmentId') appointmentId: string) {
    await this.mailchimpService.syncContact(appointmentId);
    return { message: 'Contact synced to Mailchimp' };
  }

  @Delete('disconnect/:businessId')
  async disconnect(
    @Request() req,
    @Param('businessId') businessId: string,
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

      const result = await this.mailchimpService.disconnect(
        ownerId,
        businessId,
        updateDto,
      );
      return {
        success: true,
        data: result,
        message: 'Mailchimp disconnected successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to disconnect Mailchimp',
      };
    }
  }
}
