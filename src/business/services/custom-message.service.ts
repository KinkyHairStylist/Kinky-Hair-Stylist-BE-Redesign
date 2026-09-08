import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import sgMail from '@sendgrid/mail';
import * as Twilio from 'twilio';
import { ClientSchema } from '../entities/client.entity';
import { capitalizeString } from '../utils/client.utils';
import { CustomMessage } from '../entities/custom-message.entity';
import { SendCustomMessageDto, MESSAGE_TYPE } from '../dtos/requests/CustomMesssageDto';

@Injectable()
export class CustomMessageService {
  private readonly logger = new Logger(CustomMessageService.name);
  private fromEmail: string;
  private twilioClient: Twilio.Twilio;

  constructor(
    @InjectRepository(CustomMessage)
    private customMessageRepo: Repository<CustomMessage>,

    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,

    private readonly configService: ConfigService,
  ) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      throw new Error('SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set');
    }

    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;

    this.twilioClient = new Twilio.Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendCustomMessage(payload: SendCustomMessageDto) {
    try {
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

      const { closingRemarks, ...restofPayload } = payload;
      const customMessage = this.customMessageRepo.create(restofPayload);

      // messageType was previously accepted and stored but never actually
      // read — every message went out as email regardless of what the
      // merchant selected, and SMS never sent at all.
      const wantsEmail =
        payload.messageType === MESSAGE_TYPE.EMAIL ||
        payload.messageType === MESSAGE_TYPE.EMAIL_SMS;
      const wantsSms =
        payload.messageType === MESSAGE_TYPE.SMS ||
        payload.messageType === MESSAGE_TYPE.EMAIL_SMS;

      if (wantsEmail) {
        await this.sendCustomMessageEmail(payload);
      }
      if (wantsSms) {
        await this.sendCustomMessageSms(payload);
      }

      customMessage.sent = true;
      await this.customMessageRepo.save(customMessage);

      return {
        success: true,
        data: customMessage,
        message: 'Message sent successfully',
      };
    } catch (error) {
            return {
        success: false,
        error: error.message,
        message: 'Failed to send reminder',
      };
    }
  }

  private async sendCustomMessageSms(
    data: SendCustomMessageDto,
  ): Promise<void> {
    if (!data.clientPhone) {
      this.logger.warn(
        `Skipping SMS for client ${data.clientId} — no phone number on file`,
      );
      return;
    }
    try {
      await this.twilioClient.messages.create({
        body: `${data.clientName}, ${data.message}`,
        messagingServiceSid: this.configService.get(
          'TWILIO_MESSAGING_SERVICE_SID',
        ),
        to: data.clientPhone,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send custom message SMS to ${data.clientPhone}: ${error.message}`,
      );
      throw error;
    }
  }

  private async sendCustomMessageEmail(
    data: SendCustomMessageDto,
  ): Promise<void> {
    let emailText = data.message;

    emailText = `Dear ${data.clientName},
  
${data.message}

Please let us know if you have any questions or require additional support.
        
${data.closingRemarks ?? 'Thank You'}.`;

    const msg = {
      to: data.clientEmail,
      from: this.fromEmail,
      subject: `${capitalizeString(data.messageSubject)}`,
      text: emailText,
    };

    await sgMail.send(msg);
  }
}
