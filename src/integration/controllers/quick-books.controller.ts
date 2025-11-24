import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuickBooksService } from '../services/quick-books.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Role } from 'src/middleware/role.enum';
import { Roles } from 'src/middleware/roles.decorator';

@ApiTags('QuickBooks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Business, Role.SuperAdmin)
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
