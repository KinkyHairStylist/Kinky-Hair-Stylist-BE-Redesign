import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CustomerCreateGiftCardDto {
  @ApiProperty({
    description: 'Full name of the gift card recipient',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @ApiProperty({
    description: 'Email address of the recipient (must belong to an existing user)',
    example: 'john@example.com',
  })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({
    description: 'Full name of the sender (the person purchasing the gift card)',
    example: 'Mary Johnson',
  })
  @IsNotEmpty()
  @IsString()
  senderName: string;

  @ApiPropertyOptional({
    description: 'Optional personalized message to include with the gift card',
    example: 'Happy Birthday! Enjoy your special day 🎉',
  })
  @IsOptional()
  @IsString()
  personalMessage?: string;

  @ApiProperty({
    description: 'The monetary value of the gift card in USD (or selected currency)',
    example: 50,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'The ID of the payment method (Card entity UUID)',
    example: 'b5a4b2a0-1a9c-4c2f-b3a4-73a1b5ad5f87',
  })
  @IsUUID()
  @IsNotEmpty()
  cardId: string;
}

export class RedeemGiftCardDto {
  @ApiProperty({
    description: 'Unique gift card code to redeem',
    example: '3F1A9BC2D7',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ValidateGiftCardDto {
  @ApiProperty({
    description: 'Unique gift card code to validate',
    example: '3F1A9BC2D7',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
