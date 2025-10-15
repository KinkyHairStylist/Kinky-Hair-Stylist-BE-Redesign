import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGiftCardRequest {

  @IsOptional()
  @IsString()
  recipientName?: string

  @IsOptional()
  @IsString()
  recipientEmail?: string

  @IsOptional()
  @IsString()
  senderName?: string

  @IsOptional()
  @IsString()
  personalMessage?: string

  @IsNumber()
  @Min(1)
  amount: number

  @IsOptional()
  @IsString()
  templateId?: string
}