import { IsNotEmpty, IsString, IsEmail, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PurchaserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

class RecipientDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

export class CreateGiftCardDto {
  @ValidateNested()
  @Type(() => PurchaserDto)
  purchaser: PurchaserDto;

  @ValidateNested()
  @Type(() => RecipientDto)
  recipient: RecipientDto;

  @IsString()
  business: string;

  @IsNumber()
  originalValue: number;

  @IsDateString()
  expiryDate: string; // e.g. 2026-12-31
}

export class RefundGiftCardDto {
  @ApiProperty({
    description: 'Reason for refunding the gift card',
    example: 'Customer requested refund due to mistaken purchase',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}