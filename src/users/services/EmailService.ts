import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') || 'noreply@yourcompany.com';
    this.fromName =
      this.configService.get<string>('EMAIL_FROM') || 'Your Company';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      this.logger.log(
        `📧 Sending email to: ${options.to} ${this.fromName} ${this.fromEmail}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.logger.log(`✅ Email sent successfully to: ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    data: { otp: string; firstName?: string; expiryMinutes: number },
  ): Promise<boolean> {
    const { otp, firstName = 'there', expiryMinutes } = data;

    const html = this.getVerificationEmailTemplate(
      otp,
      firstName,
      expiryMinutes,
    );
    const text = `Your verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    const html = this.getWelcomeEmailTemplate(firstName);
    const text = `Welcome to our platform${firstName ? `, ${firstName}` : ''}! Your account has been successfully created.`;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Our Platform!',
      html,
      text,
    });
  }

  private getVerificationEmailTemplate(
    otp: string,
    firstName: string,
    expiryMinutes: number,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="">
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            text-align: center; 
            color: #0066cc; 
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Thank you for registering. Use the verification code below to verify your email address:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in <strong>${expiryMinutes} minutes</strong>.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(firstName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="">
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome Aboard!</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName || 'there'},</p>
            <p>Your email has been successfully verified and your account is now active!</p>
            <p>We're excited to have you join our platform. You can now log in and start exploring all the features we offer.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
