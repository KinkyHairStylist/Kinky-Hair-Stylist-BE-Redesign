import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  async getAllWalletTransactions() {
    return this.walletService.getAllWalletTransactions();
  }
}
