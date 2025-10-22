import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import type { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  client: string;

  @IsString()
  business: string;

  @IsNumber()
  amount: number;

  @IsEnum(['paypal'])
  method: PaymentMethod;
}
