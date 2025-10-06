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

  async sendPasswordReset(email: string, resetLink?: string): Promise<void> {
    this.logger.warn(`--- MOCK EMAIL SENT ---`);
    this.logger.warn(`TO: ${email}`);
    this.logger.warn(`RESET LINK: ${resetLink}`);
    this.logger.warn(`-----------------------`);
    return;
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    this.logger.warn(`--- MOCK EMAIL SENT ---`);
    this.logger.warn(`TO: ${to}`);
    this.logger.warn(`OTP: ${otp}`);
    this.logger.warn(`-----------------------`);
    return;
  }

  async sendPasswordChangeConfirmation(to: string): Promise<void> {
    console.log(`[EMAIL HELPER] Sending Password Change Confirmation to ${to}`);
  }
}
