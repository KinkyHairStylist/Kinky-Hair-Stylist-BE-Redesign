import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reminder } from '../entities/reminder.entity';
import { Repository } from 'typeorm';
import { SendReminderDto } from '../dtos/requests/Reminder.dto';
import { ClientSchema } from '../entities/client.entity';
import { Business } from '../entities/business.entity';
import { capitalizeString } from '../utils/client.utils';
import { EmailService } from 'src/email/email.service';
import { TemplateService } from 'src/email/template.service';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Reminder)
    private reminderRepo: Repository<Reminder>,
    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
  ) {}

  async sendReminder(payload: SendReminderDto) {
    try {
      const reminder = this.reminderRepo.create(payload);

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

      await this.sendEmailReminder(payload, business?.businessName ?? 'Kinky Hairstylist');

      reminder.sent = true;
      await this.reminderRepo.save(reminder);

      return {
        success: true,
        data: reminder,
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

  private async sendEmailReminder(
    data: SendReminderDto,
    businessName: string,
  ): Promise<void> {
    const type = data.reminderType.toLowerCase();
    let message: string;

    switch (type) {
      case 'appointment':
        message = `${data.message}\n\nPlease be reminded of your appointment scheduled for ${data.date} at ${data.time}.`;
        break;

      case 'upcoming':
        message = `${data.message}\n\nThis is a reminder about your upcoming scheduled item on ${data.date} at ${data.time}. If you need assistance or wish to make changes, feel free to contact us.`;
        break;

      case 'follow_up':
        message = `${data.message}\n\nThis is a quick follow-up regarding the previous appointment on ${data.date} at ${data.time}. Please let us know if you have any questions or require additional support.`;
        break;

      case 'custom':
      default:
        message = `${data.message}\n\nHere is your reminder set for ${data.date} at ${data.time}.`;
        break;
    }

    const subject = `${capitalizeString(data.reminderType)} Reminder`;
    const frontendUrl = process.env.FRONTEND_URL || 'https://kinkyhairstylists.com';

    const html = this.templateService.render('communication-bulk', {
      businessName,
      subject,
      clientName: data.clientName,
      message,
      closingRemarks: null,
      frontendUrl,
      year: new Date().getFullYear(),
    });

    this.emailService.sendEmail(data.clientEmail, subject, message, html);
  }
}
