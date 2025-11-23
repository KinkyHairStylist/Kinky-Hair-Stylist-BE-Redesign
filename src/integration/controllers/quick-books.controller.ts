import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { QuickBooksService } from '../services/quick-books.service';

@Controller('quickbooks')
export class QuickBooksController {
  constructor(private readonly quickbooksService: QuickBooksService) {}

  @Get('auth')
  getAuthUrl() {
    return { url: this.quickbooksService.getAuthUrl() };
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('realmId') realmId: string,
    @Query('state') businessId: string,
  ) {
    await this.quickbooksService.handleOAuthCallback(code, realmId, businessId);
    return { message: 'QuickBooks connected successfully' };
  }

  @Post('invoice/:appointmentId')
  async createInvoice(@Param('appointmentId') appointmentId: string) {
    const invoiceId = await this.quickbooksService.createInvoice(appointmentId);
    return { message: 'Invoice created in QuickBooks', invoiceId };
  }

  @Delete('disconnect/:businessId')
  async disconnect(@Param('businessId') businessId: string) {
    await this.quickbooksService.disconnect(businessId);
    return { message: 'QuickBooks disconnected' };
  }
}
