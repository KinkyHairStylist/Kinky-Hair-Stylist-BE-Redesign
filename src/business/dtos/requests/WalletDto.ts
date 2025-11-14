import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import {
  PaymentMethodType,
  WalletCurrency,
} from 'src/admin/payment/enums/wallet.enum';

// DTOs for wallet operations
export class CreateWalletDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  ownerId: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  currency?: WalletCurrency;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
}

export class AddTransactionDto {
  @IsUUID()
  businessId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  currency?: WalletCurrency;

  @IsString()
  @MinLength(1)
  type: 'credit' | 'debit';

  @IsString()
  @MinLength(1)
  description?: string;

  @IsString()
  @MinLength(1)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  referenceId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  service?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  mode?: string;
}

export class AddPaymentMethodDto {
  @IsUUID()
  walletId: string;

  @MinLength(1)
  type: PaymentMethodType;

  @IsOptional()
  provider?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cardHolderName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cardNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cardExpiryDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sortCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cvv?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  last4Digits?: string;

  @IsBoolean()
  isDefault: boolean;
}
