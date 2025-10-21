import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  transactionId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  refundType?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
