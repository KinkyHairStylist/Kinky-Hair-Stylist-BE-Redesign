import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<any>('SENDGRID_API_KEY'));
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    const msg:any = {
      to,
      from: {
        email: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
        name: this.configService.get<string>('SENDGRID_FROM_NAME'),
      },
      subject,
      text,
      html: html || text,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('SendGrid Error:', error.response?.body || error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to Our App!';
    const text = `Hi ${name}, welcome to our platform!`;
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome ${name}!</h2>
        <p>Thanks for joining us. We're excited to have you on board.</p>
      </div>
    `;
    
    return this.sendEmail(to, subject, text, html);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const subject = 'Password Reset Request';
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const text = `Click this link to reset your password: ${resetUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    return this.sendEmail(to, subject, text, html);
  }
}