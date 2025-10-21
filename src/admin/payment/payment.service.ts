import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import Stripe from 'stripe';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private stripe: Stripe; // Stripe instance for handling Stripe-related operations

  constructor(
  @InjectRepository(Payment)
  private readonly paymentRepo: Repository<Payment>,
) {
  // Ensure Stripe secret key exists
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
  }

  // Initialize Stripe SDK with validated key
  this.stripe = new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover' // Ensure consistent API version across environments
  });
}

// 🧾 Create new payment
  async createPayment(dto: CreatePaymentDto) {
    const { client, business, amount, method } = dto;

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount provided');
    }

    if (!['stripe', 'paystack', 'paypal'].includes(method)) {
      throw new Error(`Unsupported payment method: ${method}`);
    }

    let paymentIntentId: string | null = null;
    let status: string = 'pending';
    let fee = 0;

    try {
      // 💳 STRIPE PAYMENT
      if (method === 'stripe') {
        fee = amount * 0.029 + 0.3;

        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // in cents
          currency: 'usd',
          description: `Payment from ${client} to ${business}`,
          automatic_payment_methods: { enabled: true },
        });

        paymentIntentId = paymentIntent.id;
        status = 'successful';
      }

      // 💰 PAYSTACK PAYMENT
      else if (method === 'paystack') {
        fee = amount * 0.015 + 100;
        if (fee > 2000) fee = 2000;

        const response = await axios.post(
          'https://api.paystack.co/transaction/initialize',
          {
            amount: Math.round(amount * 100),
            email: `${client}@example.com`,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        paymentIntentId = response.data.data.reference;
        status = 'successful';
      }

      // 🅿️ PAYPAL PAYMENT
      else if (method === 'paypal') {
        fee = amount * 0.034 + 0.3;

        const response = await axios.post(
          `${process.env.PAYPAL_SANDBOX_URL}/v1/payments/payment`,
          {
            intent: 'sale',
            payer: { payment_method: 'paypal' },
            transactions: [
              {
                amount: { total: amount.toFixed(2), currency: 'USD' },
                description: `Payment from ${client} to ${business}`,
              },
            ],
            redirect_urls: {
              return_url: 'http://localhost:3000/payment/success',
              cancel_url: 'http://localhost:3000/payment/cancel',
            },
          },
          {
            auth: {
              username: process.env.PAYPAL_CLIENT_ID!,
              password: process.env.PAYPAL_SECRET_KEY!,
            },
          },
        );

        paymentIntentId = response.data.id;
        status = 'successful';
      }

      // 💾 Save to DB
      const payment = this.paymentRepo.create({
        client,
        business,
        amount,
        method,
        status,
        fee: Number(fee.toFixed(2)),
        gatewayTransactionId: paymentIntentId,
      } as Partial<Payment>);

      return await this.paymentRepo.save(payment);
    } catch (error) {
      console.error('💥 Payment creation failed:', error.message);
      throw new Error(`Payment failed: ${error.message}`);
    }
  } 


  // 📋 Get all payment transactions from the database
  async getAll() {
    const payments = await this.paymentRepo.find();

    const paymentTx = payments.map((p) => ({
      ...p,
      date: p.createdAt.toISOString().split('T')[0],
      time: p.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    return paymentTx;
  }

  // 🔍 Retrieve details of a specific payment by its ID
  async getOne(id: string) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // 💸 Process a refund for a given transaction
  async refund(dto: RefundPaymentDto) {
    const { transactionId, amount, refundType, reason } = dto;

    // Find the original payment record in the database
    const payment = await this.paymentRepo.findOne({ where: { id: transactionId } });
    if (!payment) throw new NotFoundException('Payment not found');

    // Handle Stripe refund logic
    if (payment.method === 'stripe') {
      await this.stripe.refunds.create({
        payment_intent: payment.gatewayTransactionId, // Reference the Stripe payment intent
        amount: Math.round(amount * 100), // Stripe uses cents, so multiply by 100
      });
    }
    // Handle Paystack refund logic
    else if (payment.method === 'paystack') {
      await axios.post(
        'https://api.paystack.co/refund',
        {
          transaction: payment.gatewayTransactionId,
          amount: amount * 100, // Paystack also expects kobo (₦1 = 100 kobo)
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );
    }

    // Update payment record with refund details
    payment.status = 'refunded';
    payment.refundType = refundType;
    payment.reason = reason;
    await this.paymentRepo.save(payment);

    return { message: 'Refund successful', payment };
  }

  // ⚠️ Retrieve all disputed transactions
  async getDisputes() {
    // Disputes are filtered by their "disputed" status in the database
    return this.paymentRepo.find({ where: { status: 'disputed' } });
  }

   // 🗑️ Delete all payments
  async deleteAllPayments() {
    const result = await this.paymentRepo.clear();
    return {
      message: 'All payments have been permanently deleted.',
      result,
    };
  }
}
