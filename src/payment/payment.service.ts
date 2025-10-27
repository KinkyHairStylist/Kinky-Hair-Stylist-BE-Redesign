import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId },
      order: { 
        isDefault: 'DESC',
      }
    });
  }

  async createPaymentMethod(data: {
    userId: string;
    cardNumber: string;
    cvc: string;
    lastFour: string;
    expiryMonth: string;
    expiryYear: string;
    cardType: 'visa' | 'mastercard';
  }): Promise<PaymentMethod> {
    // If this is the first payment method, make it default
    const existingMethods = await this.getUserPaymentMethods(data.userId);
    const isDefault = existingMethods.length === 0;

    const paymentMethod = this.paymentMethodRepository.create({
      ...data,
      isDefault
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: number): Promise<void> {
    // First, remove default from all user's payment methods
    await this.paymentMethodRepository.update(
      { userId },
      { isDefault: false }
    );

    const method = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId }
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    method.isDefault = true;
    await this.paymentMethodRepository.save(method);
  }

  async deletePaymentMethod(userId: string, paymentMethodId: number): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId }
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    await this.paymentMethodRepository.remove(paymentMethod);

    // If this was the default method, make another one default if available
    if (paymentMethod.isDefault) {
      const remainingMethods = await this.getUserPaymentMethods(userId);
      if (remainingMethods.length > 0) {
        await this.setDefaultPaymentMethod(userId, remainingMethods[0].id);
      }
    }
  }
}