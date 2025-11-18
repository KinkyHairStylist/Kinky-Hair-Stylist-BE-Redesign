import {
  IsString,
  IsNumber,
  IsArray,
  IsEmail,
  IsOptional,
  Min,
  Max,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import {
  BusinessGiftCardStatus,
  BusinessGiftCardTemplate,
  BusinessSentStatus,
} from 'src/business/enum/gift-card.enum';

export class CreateBusinessGiftCardDto {
  @ApiProperty({ example: 'Premium Gift Card' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'A special gift card for premium services' })
  @IsString()
  description: string;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: ['Free delivery', 'Priority support', '10% extra discount'],
  })
  @IsArray()
  @IsString({ each: true })
  benefits: string[];

  @ApiProperty({ example: 365, default: 365 })
  @IsNumber()
  @Min(1)
  @Max(365)
  expiryInDays: number;

  @ApiProperty({ example: 'GIFTKSH-SUNSETGLOW-2024-A3B9K' })
  @IsString()
  @Matches(/^GIFTKSH-[A-Z0-9]+-\d{4}-[A-Z0-9]{5}$/, {
    message: 'Invalid gift card code format',
  })
  code: string;

  @ApiProperty({ enum: BusinessGiftCardTemplate })
  @IsEnum(BusinessGiftCardTemplate)
  template: BusinessGiftCardTemplate;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ example: 'Happy Birthday!' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsOptional()
  senderName?: string;
}

export class UpdateBusinessGiftCardDto extends PartialType(
  CreateBusinessGiftCardDto,
) {
  @ApiProperty({ enum: BusinessGiftCardStatus })
  @IsEnum(BusinessGiftCardStatus)
  @IsOptional()
  status?: BusinessGiftCardStatus;

  @ApiProperty({ enum: BusinessSentStatus })
  @IsEnum(BusinessSentStatus)
  @IsOptional()
  sentStatus?: BusinessSentStatus;
}

export class RedeemBusinessGiftCardDto {
  @ApiProperty({ example: 'ABCD-EFGH-IJKL-MNOP' })
  @IsString()
  code: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amountToRedeem?: number;
}

export class BusinessGiftCardFiltersDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  sentStatus?: string;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
