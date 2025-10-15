import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PurchaseGiftCardRequest {
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  savePaymentMethod?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  recipientEmail?: string;


  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  personalMessage?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}