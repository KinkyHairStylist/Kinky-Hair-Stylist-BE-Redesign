import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from '../interfaces/i.email.service';
/**
 * Mock implementation of the IEmailService.
 * Prints the OTP to the console instead of sending an actual email.
 * This is the service you will replace when you switch to a paid provider.
 */
@Injectable()
export class MockEmailService implements IEmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async sendOtp(to: string, otp: string): Promise<void> {
    this.logger.warn(`--- MOCK EMAIL SENT ---`);
    this.logger.warn(`TO: ${to}`);
    this.logger.warn(`OTP: ${otp}`);
    this.logger.warn(`-----------------------`);
    // NOTE: When you implement a real service (e.g., SendGridService),
    // you would replace this console log with the actual API call.
    return;
  }
}
