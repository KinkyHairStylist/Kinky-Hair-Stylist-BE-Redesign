import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiProperty({
    description: 'Optional note explaining the reason for cancellation',
    example: 'Unable to attend due to unforeseen circumstances',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancellationsNote?: string;

  @ApiProperty({
    description: 'Confirmation that user accepts cancellation terms',
    example: true,
  })
  @IsBoolean()
  acceptedTerms: boolean;
}
