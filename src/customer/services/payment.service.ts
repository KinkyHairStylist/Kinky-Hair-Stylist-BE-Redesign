import { Injectable, BadRequestException } from '@nestjs/common';
import { PurchaseGiftCardRequest } from '../dtos/request/purchase-gift-card.request';
import * as paypal from '@paypal/checkout-server-sdk';

type PayPalOrderResult = {
  id: string;
  status: string;
  purchase_units?: {
    payments?: {
      captures?: { id: string }[];
    };
  }[];
};

@Injectable()
export class PaymentService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID ?? '';
    const secret = process.env.PAYPAL_SECRET_KEY ?? '';

    const environment: paypal.core.LiveEnvironment | paypal.core.SandboxEnvironment =
      process.env.NODE_ENV === 'production'
        ? new paypal.core.LiveEnvironment(clientId, secret)
        : new paypal.core.SandboxEnvironment(clientId, secret);

    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async processGiftCardPayment(
    purchaseGiftCardRequest: PurchaseGiftCardRequest,
  ): Promise<{ success: boolean; transactionId: string }> {
    try {
      const amount = Number(purchaseGiftCardRequest.amount);
      const currency = purchaseGiftCardRequest.currency || 'USD';

      if (isNaN(amount) || amount <= 0) {
        throw new BadRequestException('Invalid payment amount');
      }

      const orderRequestBody = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: 'Gift card purchase',
          },
        ],
      };

      const createOrderRequest = new paypal.orders.OrdersCreateRequest();
      createOrderRequest.requestBody(orderRequestBody);

      const orderResponse = await this.client.execute<
        paypal.orders.OrdersCreateRequest,
        PayPalOrderResult
      >(createOrderRequest);

      const orderResult = orderResponse.result as PayPalOrderResult;
      if (!orderResult?.id) throw new Error('Invalid PayPal order response');

      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderResult.id);
      captureRequest.requestBody({});

      const captureResponse = await this.client.execute<
        paypal.orders.OrdersCaptureRequest,
        PayPalOrderResult
      >(captureRequest);

      const captureResult = captureResponse.result as PayPalOrderResult;
      const transactionId =
        captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      if (!transactionId) throw new Error('Transaction ID not found');

      return { success: true, transactionId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PayPal payment processing failed';
      console.error('PayPal payment failed:', message);
      throw new BadRequestException(message);
    }
  }

  async refundGiftCardPayment(transactionId: string): Promise<boolean> {
    try {
      const request = new paypal.payments.CapturesRefundRequest(transactionId);
      request.requestBody({});

      const refundResponse = await this.client.execute<
        paypal.payments.CapturesRefundRequest,
        Record<string, unknown>
      >(request);

      if (!refundResponse || typeof refundResponse.result !== 'object') {
        throw new Error('Invalid refund response');
      }

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PayPal refund failed';
      console.error('PayPal refund failed:', message);
      throw new BadRequestException(message);
    }
  }
}
