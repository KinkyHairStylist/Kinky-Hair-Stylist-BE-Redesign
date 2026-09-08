import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConfirmBookingDto {
  @ApiProperty({
    example: 'BKID-1234567',
    description: 'The order ID of the booking to confirm',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    example: 'paystack',
    description: 'Which payment provider to use for the card portion (defaults to paystack)',
    enum: ['paystack', 'stripe'],
    required: false,
  })
  @IsOptional()
  @IsIn(['paystack', 'stripe'])
  paymentProvider?: 'paystack' | 'stripe';

  @ApiProperty({
    example: true,
    description: 'Whether to pay at the venue',
  })
  @IsBoolean()
  payAtVenue: boolean;

  @ApiProperty({
    example: 'card-123',
    description: 'The card ID for payment (optional)',
  })
  @IsString()
  @IsOptional()
  cardId?: string;

  @ApiProperty({
    example: 'gift-456',
    description: 'The gift card for payment (optional)',
  })
  @IsString()
  @IsOptional()
  giftCard?: string;

  @ApiProperty({
    example: true,
    description: 'Pay a 50% deposit now via Stripe, the rest directly to the merchant at the venue (Stripe only)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  depositOnly?: boolean;

  @ApiProperty({
    example: 'b5a4b2a0-1a9c-4c2f-b3a4-73a1b5ad5f87',
    description: 'A MerchantMembershipPurchase id to redeem session(s) from instead of paying by card/gift card',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  membershipPurchaseId?: string;
}
