import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaystackService {
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY;
  private readonly baseUrl = process.env.PAYSTACK_BASE_URL;

  constructor() {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY must be set');
    }
  }

  /** Initialize Paystack Payment */
  async initializePayment(payload: {
    email: string;
    amount: number; // in kobo
    metadata?: any;
  }) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return res.data.data;
    } catch (error) {
      throw new BadRequestException('Unable to initialize Paystack payment');
    }
  }

  /** Verify Paystack Payment */
  async verifyPayment(reference: string) {
    try {
      const res = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return res.data.data;
    } catch (error) {
      throw new BadRequestException('Unable to verify Paystack payment');
    }
  }
}
