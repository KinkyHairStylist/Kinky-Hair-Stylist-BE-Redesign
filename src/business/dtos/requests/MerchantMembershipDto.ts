import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMerchantMembershipPackageDto {
  @ApiProperty({ description: 'Service this membership package covers', example: 'b5a4b2a0-1a9c-4c2f-b3a4-73a1b5ad5f87' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Price charged per session', example: 50 })
  @IsNumber()
  @Min(0.01)
  pricePerSession: number;

  @ApiProperty({ description: 'Number of sessions included in the package', example: 5 })
  @IsNumber()
  @Min(1)
  sessionCount: number;

  @ApiPropertyOptional({ description: 'Days until the purchase expires (default 365)', example: 365 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiryDays?: number;
}
