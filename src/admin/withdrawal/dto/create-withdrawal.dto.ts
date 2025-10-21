import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateWithdrawalDto {
  @IsString()
  businessName: string;

  @IsString()
  bankDetails: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  currentBalance: number;
}

