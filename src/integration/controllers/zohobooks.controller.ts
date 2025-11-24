import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ZohoBooksService } from '../services/zohobooks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Role } from 'src/middleware/role.enum';
import { Roles } from 'src/middleware/roles.decorator';

@ApiTags('ZohoBooks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Business, Role.SuperAdmin)
@Controller('zohobooks')
export class ZohoBooksController {
  constructor(private readonly zohoBooksService: ZohoBooksService) {}

  /**
   * GET /api/zohobooks/connect/:businessId
   * Generate ZohoBooks authorization URL
   */
  @Get('connect/:businessId')
  connectZohoBooks(@Request() req, @Param('businessId') businessId: string) {
    try {
      const ownerId = req.user.id || req.user.sub;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const authUrl = this.zohoBooksService.getAuthUrl(businessId);

      return {
        success: true,
        data: authUrl,
        message: 'ZohoBooks authentication url sent',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to generate zohobooks url',
      };
    }
  }

  /**
   * GET /api/zohobooks/callback?code=xxx&state=businessId
   * Handle OAuth callback from ZohoBooks
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') businessId: string,
    @Query('error') error: string,
    // @Res() res: Response,
  ) {
    // if (error || !code) {
    //   return res.redirect(
    //     `${process.env.FRONTEND_URL}/settings/integrations?error=auth_failed&service=zohobooks`,
    //   );
    // }

    try {
      const result = await this.zohoBooksService.handleOAuthCallback(
        code,
        businessId,
      );

      return result;
      //   return res.redirect(
      //     `${process.env.FRONTEND_URL}/settings/integrations?success=true&service=zohobooks`,
      //   );
    } catch (error) {
      console.error('ZohoBooks OAuth error:', error);
      //   return res.redirect(
      //     `${process.env.FRONTEND_URL}/settings/integrations?error=auth_failed&service=zohobooks`,
      //   );
    }
  }

  /**
   * GET /api/zohobooks/status/:businessId
   * Check connection status
   */
  @Get('status/:businessId')
  async getStatus(@Param('businessId') businessId: string) {
    const isConnected = await this.zohoBooksService.isConnected(businessId);
    return {
      connected: isConnected,
      service: 'zohobooks',
    };
  }

  /**
   * POST /api/zohobooks/invoice/:appointmentId
   * Create invoice for appointment
   */
  @Post('invoice/:appointmentId')
  async createInvoice(@Param('appointmentId') appointmentId: string) {
    const invoiceId = await this.zohoBooksService.createInvoice(appointmentId);
    return {
      success: true,
      message: 'Invoice created in ZohoBooks',
      invoiceId,
    };
  }

  /**
   * POST /api/zohobooks/payment/:appointmentId/:invoiceId
   * Record payment for invoice
   */
  @Post('payment/:appointmentId/:invoiceId')
  async recordPayment(
    @Param('appointmentId') appointmentId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    await this.zohoBooksService.recordPayment(appointmentId, invoiceId);
    return {
      success: true,
      message: 'Payment recorded in ZohoBooks',
    };
  }

  /**
   * DELETE /api/zohobooks/disconnect/:businessId
   * Disconnect ZohoBooks integration
   */
  @Delete('disconnect/:businessId')
  async disconnect(@Param('businessId') businessId: string) {
    await this.zohoBooksService.disconnect(businessId);
    return {
      success: true,
      message: 'ZohoBooks disconnected successfully',
    };
  }
}

// ============================================
// 6. USAGE IN APPOINTMENT SERVICE
// ============================================
/*
// appointment.service.ts

async completeAppointment(id: string) {
  const appointment = await this.appointmentRepo.findOne({ where: { id } });
  appointment.status = AppointmentStatus.COMPLETED;
  appointment.paymentStatus = PaymentStatus.PAID;
  await this.appointmentRepo.save(appointment);

  try {
    // Create customer and invoice in ZohoBooks
    const invoiceId = await this.zohoBooksService.createInvoice(id);
    
    // Record payment
    await this.zohoBooksService.recordPayment(id, invoiceId);
    
    // Store invoice ID in appointment
    appointment.zohoInvoiceId = invoiceId;
    await this.appointmentRepo.save(appointment);
  } catch (error) {
    console.error('Failed to sync with ZohoBooks:', error);
  }

  return appointment;
}
*/

// ============================================
// 7. ADD TO APPOINTMENT ENTITY
// ============================================
/*
// Add this column to your Appointment entity:

@Column({ type: 'varchar', nullable: true })
zohoInvoiceId?: string;

@Column({ type: 'varchar', nullable: true })
zohoCustomerId?: string;
*/
