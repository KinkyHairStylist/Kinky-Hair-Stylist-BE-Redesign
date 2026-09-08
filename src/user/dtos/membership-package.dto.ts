import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class PurchaseMembershipPackageDto {
  @ApiProperty({ description: 'Card ID used to make the purchase', required: false })
  @IsUUID()
  @IsOptional()
  cardId?: string;
}

export class CompleteMembershipPurchaseDto {
  @ApiProperty({ description: 'Stripe PaymentIntent id returned from POST /purchase' })
  @IsString()
  @IsNotEmpty()
  reference: string;
}
