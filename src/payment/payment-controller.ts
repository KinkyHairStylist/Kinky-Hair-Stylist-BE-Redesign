import { Controller, Post, Body, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('api/payment-methods')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  async addPaymentMethod(
    @Body() paymentData: any,
    @Req() req: any
  ) {
    const userId = req.session?.userId || 1; // Get from session
    
    // Validate card details (add proper validation)
    const lastFour = paymentData.cardNumber.slice(-4);
    const [expiryMonth, expiryYear] = paymentData.expiry.split('/');
    
    return this.paymentService.createPaymentMethod({
      userId,
      cardNumber: paymentData.cardNumber,
      cvc: paymentData.cvc,
      lastFour,
      expiryMonth,
      expiryYear,
      cardType: this.detectCardType(paymentData.cardNumber)
    });
  }

  private detectCardType(cardNumber: string): 'visa' | 'mastercard' {
    if (cardNumber.startsWith('4')) return 'visa';
    return 'mastercard';
  }
}