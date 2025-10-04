import { Injectable } from '@nestjs/common';

/**
 * Defines the contract for any email sending service (Adapter Pattern).
 * This allows swapping between Mock, SendGrid, AWS SES, etc., easily.
 */
@Injectable()
export abstract class IEmailService {
  /**
   * Sends an OTP code to a user's email address.
   * @param to The recipient's email address.
   * @param otp The one-time password to send.
   */
  abstract sendOtp(to: string, otp: string): Promise<void>;
  abstract sendPasswordReset(email: string, resetLink?: string): Promise<void>;
}
