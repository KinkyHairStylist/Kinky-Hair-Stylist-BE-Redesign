import { IsString, IsEmail, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
