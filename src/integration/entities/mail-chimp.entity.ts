// // ============================================
// // MAILCHIMP INTEGRATION
// // ============================================
// // npm install @mailchimp/mailchimp_marketing
// // npm install @mailchimp/mailchimp_transactional

// import mailchimp from '@mailchimp/mailchimp_marketing';
// import { Injectable, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';

// // ============================================
// // 1. MAILCHIMP CREDENTIALS ENTITY
// // ============================================
// @Entity('mailchimp_credentials')
// export class MailchimpCredentials {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(() => Business, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'business_id' })
//   business: Business;

//   @Column({ type: 'text' })
//   apiKey: string;

//   @Column({ type: 'varchar' })
//   serverPrefix: string; // e.g., 'us1', 'us19'

//   @Column({ type: 'varchar', nullable: true })
//   audienceId: string; // List ID for contacts

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   createdAt: Date;
// }

// // ============================================
// // 2. MAILCHIMP SERVICE
// // ============================================
// @Injectable()
// export class MailchimpService {
//   constructor(
//     @InjectRepository(MailchimpCredentials)
//     private mailchimpCredsRepo: Repository<MailchimpCredentials>,
//     @InjectRepository(Appointment)
//     private appointmentRepo: Repository<Appointment>,
//   ) {}

//   /**
//    * Connect Mailchimp with API key
//    */
//   async connect(businessId: string, apiKey: string, audienceId?: string): Promise<void> {
//     // Extract server prefix from API key (last part after the dash)
//     const serverPrefix = apiKey.split('-').pop();

//     // Test the API key
//     mailchimp.setConfig({
//       apiKey,
//       server: serverPrefix,
//     });

//     try {
//       await mailchimp.ping.get();

//       // Save credentials
//       let credentials = await this.mailchimpCredsRepo.findOne({
//         where: { business: { id: businessId } },
//       });

//       if (credentials) {
//         credentials.apiKey = apiKey;
//         credentials.serverPrefix = serverPrefix;
//         credentials.audienceId = audienceId || credentials.audienceId;
//       } else {
//         credentials = this.mailchimpCredsRepo.create({
//           business: { id: businessId },
//           apiKey,
//           serverPrefix,
//           audienceId,
//         });
//       }

//       await this.mailchimpCredsRepo.save(credentials);
//     } catch (error) {
//       throw new BadRequestException('Invalid Mailchimp API key: ' + error.message);
//     }
//   }

//   /**
//    * Get configured Mailchimp client for business
//    */
//   private async getClient(businessId: string) {
//     const credentials = await this.mailchimpCredsRepo.findOne({
//       where: { business: { id: businessId } },
//     });

//     if (!credentials) {
//       throw new BadRequestException('Mailchimp not connected for this business');
//     }

//     mailchimp.setConfig({
//       apiKey: credentials.apiKey,
//       server: credentials.serverPrefix,
//     });

//     return { client: mailchimp, audienceId: credentials.audienceId };
//   }

//   /**
//    * Add/Update client as Mailchimp contact
//    */
//   async syncContact(appointmentId: string): Promise<void> {
//     const appointment = await this.appointmentRepo.findOne({
//       where: { id: appointmentId },
//       relations: ['business', 'client'],
//     });

//     if (!appointment) {
//       throw new BadRequestException('Appointment not found');
//     }

//     const { client: mc, audienceId } = await this.getClient(appointment.business.id);

//     if (!audienceId) {
//       throw new BadRequestException('Mailchimp audience not configured');
//     }

//     try {
//       const subscriberHash = require('crypto')
//         .createHash('md5')
//         .update(appointment.client.email.toLowerCase())
//         .digest('hex');

//       // Add or update contact
//       await mc.lists.setListMember(audienceId, subscriberHash, {
//         email_address: appointment.client.email,
//         status_if_new: 'subscribed',
//         merge_fields: {
//           FNAME: appointment.client.name.split(' ')[0],
//           LNAME: appointment.client.name.split(' ').slice(1).join(' ') || '',
//           PHONE: appointment.client.phone || '',
//         },
//         tags: ['customer', 'appointment-booked'],
//       });
//     } catch (error) {
//       console.error('Failed to sync contact to Mailchimp:', error);
//       throw new BadRequestException('Failed to sync contact: ' + error.message);
//     }
//   }

//   /**
//    * Send appointment confirmation email
//    */
//   async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
//     const appointment = await this.appointmentRepo.findOne({
//       where: { id: appointmentId },
//       relations: ['business', 'client', 'staff'],
//     });

//     if (!appointment) {
//       throw new BadRequestException('Appointment not found');
//     }

//     const { client: mc } = await this.getClient(appointment.business.id);

//     try {
//       await mc.messages.send({
//         message: {
//           subject: `Appointment Confirmation - ${appointment.serviceName}`,
//           text: `
// Hi ${appointment.client.name},

// Your appointment has been confirmed!

// Service: ${appointment.serviceName}
// Date: ${appointment.date}
// Time: ${appointment.time}
// Duration: ${appointment.duration}
// Staff: ${appointment.staff.map(s => s.name).join(', ')}
// Location: ${appointment.business.address}

// Amount: $${appointment.amount}
// Payment Status: ${appointment.paymentStatus}

// ${appointment.specialRequests ? `Special Requests: ${appointment.specialRequests}` : ''}

// If you need to reschedule or cancel, please contact us.

// Thank you,
// ${appointment.business.name}
//           `.trim(),
//           from_email: appointment.business.email,
//           to: [
//             {
//               email: appointment.client.email,
//               name: appointment.client.name,
//               type: 'to',
//             },
//           ],
//         },
//       });
//     } catch (error) {
//       console.error('Failed to send email via Mailchimp:', error);
//     }
//   }

//   /**
//    * Send appointment reminder (24 hours before)
//    */
//   async sendAppointmentReminder(appointmentId: string): Promise<void> {
//     const appointment = await this.appointmentRepo.findOne({
//       where: { id: appointmentId },
//       relations: ['business', 'client', 'staff'],
//     });

//     if (!appointment) return;

//     const { client: mc } = await this.getClient(appointment.business.id);

//     try {
//       await mc.messages.send({
//         message: {
//           subject: `Reminder: Appointment Tomorrow - ${appointment.serviceName}`,
//           text: `
// Hi ${appointment.client.name},

// This is a friendly reminder about your upcoming appointment tomorrow!

// Service: ${appointment.serviceName}
// Date: ${appointment.date}
// Time: ${appointment.time}
// Staff: ${appointment.staff.map(s => s.name).join(', ')}
// Location: ${appointment.business.address}

// We look forward to seeing you!

// ${appointment.business.name}
//           `.trim(),
//           from_email: appointment.business.email,
//           to: [
//             {
//               email: appointment.client.email,
//               name: appointment.client.name,
//               type: 'to',
//             },
//           ],
//         },
//       });
//     } catch (error) {
//       console.error('Failed to send reminder via Mailchimp:', error);
//     }
//   }

//   /**
//    * Disconnect Mailchimp
//    */
//   async disconnect(businessId: string): Promise<void> {
//     await this.mailchimpCredsRepo.delete({ business: { id: businessId } });
//   }
// }

// // ============================================
// // QUICKBOOKS INTEGRATION
// // ============================================
// // npm install node-quickbooks
// // npm install @types/node-quickbooks --save-dev

// import * as QuickBooks from 'node-quickbooks';

// // ============================================
// // 3. QUICKBOOKS CREDENTIALS ENTITY
// // ============================================
// // @Entity('quickbooks_credentials')
// // export class QuickBooksCredentials {
// //   @PrimaryGeneratedColumn('uuid')
// //   id: string;

// //   @ManyToOne(() => Business, { onDelete: 'CASCADE' })
// //   @JoinColumn({ name: 'business_id' })
// //   business: Business;

// //   @Column({ type: 'text' })
// //   accessToken: string;

// //   @Column({ type: 'text' })
// //   refreshToken: string;

// //   @Column({ type: 'varchar' })
// //   realmId: string; // Company ID

// //   @Column({ type: 'bigint' })
// //   expiryDate: number;

// //   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
// //   createdAt: Date;
// // }

// // ============================================
// // 4. QUICKBOOKS SERVICE
// // ============================================
// @Injectable()
// export class QuickBooksService {
//   constructor(
//     @InjectRepository(QuickBooksCredentials)
//     private qbCredsRepo: Repository<QuickBooksCredentials>,
//     @InjectRepository(Appointment)
//     private appointmentRepo: Repository<Appointment>,
//   ) {}

//   /**
//    * Generate QuickBooks OAuth URL
//    */
//   getAuthUrl(): string {
//     const qb = new QuickBooks(
//       process.env.QUICKBOOKS_CLIENT_ID,
//       process.env.QUICKBOOKS_CLIENT_SECRET,
//       process.env.QUICKBOOKS_REDIRECT_URI,
//       false, // Use sandbox? false for production
//       true, // Enable logging
//       null,
//       '2.0',
//       null,
//     );

//     return qb.authorizeUrl(
//       'openid profile email com.intuit.quickbooks.accounting',
//       process.env.QUICKBOOKS_REDIRECT_URI,
//     );
//   }

//   /**
//    * Handle OAuth callback
//    */
//   async handleOAuthCallback(
//     code: string,
//     realmId: string,
//     businessId: string,
//   ): Promise<void> {
//     const qb = new QuickBooks(
//       process.env.QUICKBOOKS_CLIENT_ID,
//       process.env.QUICKBOOKS_CLIENT_SECRET,
//       process.env.QUICKBOOKS_REDIRECT_URI,
//       false,
//       true,
//       null,
//       '2.0',
//       null,
//     );

//     return new Promise((resolve, reject) => {
//       qb.getAccessToken(code, async (err, authResponse) => {
//         if (err) {
//           return reject(new BadRequestException('Failed to get access token: ' + err));
//         }

//         try {
//           let credentials = await this.qbCredsRepo.findOne({
//             where: { business: { id: businessId } },
//           });

//           const expiryDate = Date.now() + authResponse.expires_in * 1000;

//           if (credentials) {
//             credentials.accessToken = authResponse.access_token;
//             credentials.refreshToken = authResponse.refresh_token;
//             credentials.realmId = realmId;
//             credentials.expiryDate = expiryDate;
//           } else {
//             credentials = this.qbCredsRepo.create({
//               business: { id: businessId },
//               accessToken: authResponse.access_token,
//               refreshToken: authResponse.refresh_token,
//               realmId,
//               expiryDate,
//             });
//           }

//           await this.qbCredsRepo.save(credentials);
//           resolve();
//         } catch (error) {
//           reject(error);
//         }
//       });
//     });
//   }

//   /**
//    * Get QuickBooks client
//    */
//   private async getClient(businessId: string): Promise<QuickBooks> {
//     const credentials = await this.qbCredsRepo.findOne({
//       where: { business: { id: businessId } },
//     });

//     if (!credentials) {
//       throw new BadRequestException('QuickBooks not connected for this business');
//     }

//     // Check if token needs refresh
//     if (Date.now() >= credentials.expiryDate - 300000) { // 5 minutes buffer
//       await this.refreshAccessToken(credentials);
//     }

//     const qb = new QuickBooks(
//       process.env.QUICKBOOKS_CLIENT_ID,
//       process.env.QUICKBOOKS_CLIENT_SECRET,
//       credentials.accessToken,
//       false,
//       true,
//       credentials.realmId,
//       true,
//       '2.0',
//     );

//     qb.realmId = credentials.realmId;
//     return qb;
//   }

//   /**
//    * Refresh access token
//    */
//   private async refreshAccessToken(credentials: QuickBooksCredentials): Promise<void> {
//     const qb = new QuickBooks(
//       process.env.QUICKBOOKS_CLIENT_ID,
//       process.env.QUICKBOOKS_CLIENT_SECRET,
//       null,
//       false,
//       true,
//       null,
//       '2.0',
//       credentials.refreshToken,
//     );

//     return new Promise((resolve, reject) => {
//       qb.refreshAccessToken((err, authResponse) => {
//         if (err) {
//           return reject(err);
//         }

//         credentials.accessToken = authResponse.access_token;
//         credentials.refreshToken = authResponse.refresh_token;
//         credentials.expiryDate = Date.now() + authResponse.expires_in * 1000;

//         this.qbCredsRepo.save(credentials).then(() => resolve()).catch(reject);
//       });
//     });
//   }

//   /**
//    * Create customer in QuickBooks
//    */
//   async createCustomer(appointmentId: string): Promise<string> {
//     const appointment = await this.appointmentRepo.findOne({
//       where: { id: appointmentId },
//       relations: ['client', 'business'],
//     });

//     if (!appointment) {
//       throw new BadRequestException('Appointment not found');
//     }

//     const qb = await this.getClient(appointment.business.id);

//     return new Promise((resolve, reject) => {
//       const customerData = {
//         DisplayName: appointment.client.name,
//         PrimaryEmailAddr: { Address: appointment.client.email },
//         PrimaryPhone: appointment.client.phone ? { FreeFormNumber: appointment.client.phone } : undefined,
//       };

//       qb.createCustomer(customerData, (err, customer) => {
//         if (err) {
//           console.error('Failed to create customer in QuickBooks:', err);
//           return reject(err);
//         }
//         resolve(customer.Id);
//       });
//     });
//   }

//   /**
//    * Create invoice for appointment
//    */
//   async createInvoice(appointmentId: string, customerId?: string): Promise<string> {
//     const appointment = await this.appointmentRepo.findOne({
//       where: { id: appointmentId },
//       relations: ['client', 'business', 'staff'],
//     });

//     if (!appointment) {
//       throw new BadRequestException('Appointment not found');
//     }

//     const qb = await this.getClient(appointment.business.id);

//     // Create customer if not provided
//     if (!customerId) {
//       customerId = await this.createCustomer(appointmentId);
//     }

//     return new Promise((resolve, reject) => {
//       const invoiceData = {
//         CustomerRef: { value: customerId },
//         Line: [
//           {
//             DetailType: 'SalesItemLineDetail',
//             Amount: appointment.amount,
//             Description: `${appointment.serviceName} - ${appointment.date} ${appointment.time}`,
//             SalesItemLineDetail: {
//               Qty: 1,
//               UnitPrice: appointment.amount,
//               // You may need to create a Service item in QuickBooks first
//               // ItemRef: { value: "1" }, // Replace with actual service item ID
//             },
//           },
//         ],
//         DueDate: appointment.date,
//         TxnDate: new Date().toISOString().split('T')[0],
//       };

//       qb.createInvoice(invoiceData, (err, invoice) => {
//         if (err) {
//           console.error('Failed to create invoice in QuickBooks:', err);
//           return reject(err);
//         }
//         resolve(invoice.Id);
//       });
//     });
//   }

//   /**
//    * Create payment record
//    */
//   async createPayment(
//     appointmentId: string,
//     invoiceId: string,
//     customerId: string,
//   ): Promise<void> {
//     const appointment = await this.appointmentRepo.findOne({
//       where: { id: appointmentId },
//       relations: ['business'],
//     });

//     if (!appointment) {
//       throw new BadRequestException('Appointment not found');
//     }

//     const qb = await this.getClient(appointment.business.id);

//     return new Promise((resolve, reject) => {
//       const paymentData = {
//         CustomerRef: { value: customerId },
//         TotalAmt: appointment.amount,
//         Line: [
//           {
//             Amount: appointment.amount,
//             LinkedTxn: [
//               {
//                 TxnId: invoiceId,
//                 TxnType: 'Invoice',
//               },
//             ],
//           },
//         ],
//       };

//       qb.createPayment(paymentData, (err, payment) => {
//         if (err) {
//           console.error('Failed to create payment in QuickBooks:', err);
//           return reject(err);
//         }
//         resolve();
//       });
//     });
//   }

//   /**
//    * Disconnect QuickBooks
//    */
//   async disconnect(businessId: string): Promise<void> {
//     await this.qbCredsRepo.delete({ business: { id: businessId } });
//   }
// }

// // ============================================
// // 5. INTEGRATION CONTROLLERS
// // ============================================
// @Controller('mailchimp')
// export class MailchimpController {
//   constructor(private readonly mailchimpService: MailchimpService) {}

//   @Post('connect')
//   async connect(
//     @Body() body: { businessId: string; apiKey: string; audienceId?: string },
//   ) {
//     await this.mailchimpService.connect(body.businessId, body.apiKey, body.audienceId);
//     return { message: 'Mailchimp connected successfully' };
//   }

//   @Post('sync/:appointmentId')
//   async syncContact(@Param('appointmentId') appointmentId: string) {
//     await this.mailchimpService.syncContact(appointmentId);
//     return { message: 'Contact synced to Mailchimp' };
//   }

//   @Delete('disconnect/:businessId')
//   async disconnect(@Param('businessId') businessId: string) {
//     await this.mailchimpService.disconnect(businessId);
//     return { message: 'Mailchimp disconnected' };
//   }
// }

// @Controller('quickbooks')
// export class QuickBooksController {
//   constructor(private readonly quickbooksService: QuickBooksService) {}

//   @Get('auth')
//   getAuthUrl() {
//     return { url: this.quickbooksService.getAuthUrl() };
//   }

//   @Get('callback')
//   async handleCallback(
//     @Query('code') code: string,
//     @Query('realmId') realmId: string,
//     @Query('state') businessId: string,
//   ) {
//     await this.quickbooksService.handleOAuthCallback(code, realmId, businessId);
//     return { message: 'QuickBooks connected successfully' };
//   }

//   @Post('invoice/:appointmentId')
//   async createInvoice(@Param('appointmentId') appointmentId: string) {
//     const invoiceId = await this.quickbooksService.createInvoice(appointmentId);
//     return { message: 'Invoice created in QuickBooks', invoiceId };
//   }

//   @Delete('disconnect/:businessId')
//   async disconnect(@Param('businessId') businessId: string) {
//     await this.quickbooksService.disconnect(businessId);
//     return { message: 'QuickBooks disconnected' };
//   }
// }

// // ============================================
// // 6. ENVIRONMENT VARIABLES
// // ============================================
// /*
// QUICKBOOKS_CLIENT_ID=your_client_id
// QUICKBOOKS_CLIENT_SECRET=your_client_secret
// QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
// */
