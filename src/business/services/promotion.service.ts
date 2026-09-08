import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientSchema } from '../entities/client.entity';
import { Business } from '../entities/business.entity';
import { Promotion } from '../entities/promotion.entity';
import { SendPromotionDto } from '../dtos/requests/PromotionDto';
import { EmailService } from 'src/email/email.service';
import { TemplateService } from 'src/email/template.service';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepo: Repository<Promotion>,
    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
  ) {}

  async sendPromotion(payload: SendPromotionDto) {
    try {
      const promotion = this.promotionRepo.create(payload);

      const client = await this.clientRepo.findOneBy({
        id: payload.clientId,
        email: payload.clientEmail,
      });

      if (!client) {
        return {
          success: false,
          error: 'Client account not found',
          message: 'This client profile not found',
        };
      }

      const business = payload.businessId
        ? await this.businessRepo.findOne({ where: { id: payload.businessId } })
        : null;

      await this.sendEmailPromotion(payload, business?.businessName ?? 'Kinky Hairstylist');

      promotion.sent = true;
      await this.promotionRepo.save(promotion);

      return {
        success: true,
        data: promotion,
        message: 'Reminder sent successfully',
      };
    } catch (error) {
            return {
        success: false,
        error: error.message,
        message: 'Failed to send reminder',
      };
    }
  }

  private async sendEmailPromotion(
    data: SendPromotionDto,
    businessName: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://kinkyhairstylists.com';
    const message = `${data.discount}${data.discountType} OFF!\n\n${data.description}\n\nUse code ${data.promotionCode} — offer ends ${data.expiryDate} midnight. Hurry!`;

    const html = this.templateService.render('communication-bulk', {
      businessName,
      subject: data.promotionTitle.toUpperCase(),
      clientName: data.clientName,
      message,
      closingRemarks: null,
      frontendUrl,
      year: new Date().getFullYear(),
    });

    this.emailService.sendEmail(
      data.clientEmail,
      data.promotionTitle.toUpperCase(),
      message,
      html,
    );
  }
}
