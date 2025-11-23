import { BadRequestException, Injectable } from '@nestjs/common';
import * as QuickBooks from 'node-quickbooks';
import { QuickBooksCredentials } from '../entities/quick-books.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from 'src/business/entities/appointment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class QuickBooksService {
  constructor(
    @InjectRepository(QuickBooksCredentials)
    private qbCredsRepo: Repository<QuickBooksCredentials>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  /**
   * Generate QuickBooks OAuth URL
   */
  getAuthUrl(): string {
    const qb = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID,
      process.env.QUICKBOOKS_CLIENT_SECRET,
      process.env.QUICKBOOKS_REDIRECT_URI,
      false, // Use sandbox? false for production
      true, // Enable logging
      null,
      '2.0',
      null,
    );

    return qb.authorizeUrl(
      'openid profile email com.intuit.quickbooks.accounting',
      process.env.QUICKBOOKS_REDIRECT_URI,
    );
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    code: string,
    realmId: string,
    businessId: string,
  ): Promise<void> {
    const qb = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID,
      process.env.QUICKBOOKS_CLIENT_SECRET,
      process.env.QUICKBOOKS_REDIRECT_URI,
      false,
      true,
      null,
      '2.0',
      null,
    );

    return new Promise((resolve, reject) => {
      qb.getAccessToken(code, async (err, authResponse) => {
        if (err) {
          return reject(
            new BadRequestException('Failed to get access token: ' + err),
          );
        }

        try {
          let credentials = await this.qbCredsRepo.findOne({
            where: { business: { id: businessId } },
          });

          const expiryDate = Date.now() + authResponse.expires_in * 1000;

          if (credentials) {
            credentials.accessToken = authResponse.access_token;
            credentials.refreshToken = authResponse.refresh_token;
            credentials.realmId = realmId;
            credentials.expiryDate = expiryDate;
          } else {
            credentials = this.qbCredsRepo.create({
              business: { id: businessId },
              accessToken: authResponse.access_token,
              refreshToken: authResponse.refresh_token,
              realmId,
              expiryDate,
            });
          }

          await this.qbCredsRepo.save(credentials);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Get QuickBooks client
   */
  private async getClient(businessId: string): Promise<QuickBooks> {
    const credentials = await this.qbCredsRepo.findOne({
      where: { business: { id: businessId } },
    });

    if (!credentials) {
      throw new BadRequestException(
        'QuickBooks not connected for this business',
      );
    }

    // Check if token needs refresh
    if (Date.now() >= credentials.expiryDate - 300000) {
      // 5 minutes buffer
      await this.refreshAccessToken(credentials);
    }

    const qb = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID,
      process.env.QUICKBOOKS_CLIENT_SECRET,
      credentials.accessToken,
      false,
      true,
      credentials.realmId,
      true,
      '2.0',
    );

    qb.realmId = credentials.realmId;
    return qb;
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(
    credentials: QuickBooksCredentials,
  ): Promise<void> {
    const qb = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID,
      process.env.QUICKBOOKS_CLIENT_SECRET,
      null,
      false,
      true,
      null,
      '2.0',
      credentials.refreshToken,
    );

    return new Promise((resolve, reject) => {
      qb.refreshAccessToken((err, authResponse) => {
        if (err) {
          return reject(err);
        }

        credentials.accessToken = authResponse.access_token;
        credentials.refreshToken = authResponse.refresh_token;
        credentials.expiryDate = Date.now() + authResponse.expires_in * 1000;

        this.qbCredsRepo
          .save(credentials)
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  /**
   * Create customer in QuickBooks
   */
  async createCustomer(appointmentId: string): Promise<string> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['client', 'business'],
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    const qb = await this.getClient(appointment.business.id);

    return new Promise((resolve, reject) => {
      const customerData = {
        DisplayName: appointment.client.firstName,
        PrimaryEmailAddr: { Address: appointment.client.email },
        PrimaryPhone: appointment.client.phoneNumber
          ? { FreeFormNumber: appointment.client.phoneNumber }
          : undefined,
      };

      qb.createCustomer(customerData, (err, customer) => {
        if (err) {
          console.error('Failed to create customer in QuickBooks:', err);
          return reject(err);
        }
        resolve(customer.Id);
      });
    });
  }

  /**
   * Create invoice for appointment
   */
  async createInvoice(
    appointmentId: string,
    customerId?: string,
  ): Promise<string> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['client', 'business', 'staff'],
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    const qb = await this.getClient(appointment.business.id);

    // Create customer if not provided
    if (!customerId) {
      customerId = await this.createCustomer(appointmentId);
    }

    return new Promise((resolve, reject) => {
      const invoiceData = {
        CustomerRef: { value: customerId },
        Line: [
          {
            DetailType: 'SalesItemLineDetail',
            Amount: appointment.amount,
            Description: `${appointment.serviceName} - ${appointment.date} ${appointment.time}`,
            SalesItemLineDetail: {
              Qty: 1,
              UnitPrice: appointment.amount,
              // You may need to create a Service item in QuickBooks first
              // ItemRef: { value: "1" }, // Replace with actual service item ID
            },
          },
        ],
        DueDate: appointment.date,
        TxnDate: new Date().toISOString().split('T')[0],
      };

      qb.createInvoice(invoiceData, (err, invoice) => {
        if (err) {
          console.error('Failed to create invoice in QuickBooks:', err);
          return reject(err);
        }
        resolve(invoice.Id);
      });
    });
  }

  /**
   * Create payment record
   */
  async createPayment(
    appointmentId: string,
    invoiceId: string,
    customerId: string,
  ): Promise<void> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['business'],
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    const qb = await this.getClient(appointment.business.id);

    return new Promise((resolve, reject) => {
      const paymentData = {
        CustomerRef: { value: customerId },
        TotalAmt: appointment.amount,
        Line: [
          {
            Amount: appointment.amount,
            LinkedTxn: [
              {
                TxnId: invoiceId,
                TxnType: 'Invoice',
              },
            ],
          },
        ],
      };

      qb.createPayment(paymentData, (err, payment) => {
        if (err) {
          console.error('Failed to create payment in QuickBooks:', err);
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Disconnect QuickBooks
   */
  async disconnect(businessId: string): Promise<void> {
    await this.qbCredsRepo.delete({ business: { id: businessId } });
  }
}
