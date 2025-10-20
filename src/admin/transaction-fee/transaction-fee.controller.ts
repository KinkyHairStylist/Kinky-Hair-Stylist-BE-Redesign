import { Controller, Get, Patch, Body } from '@nestjs/common';
import { TransactionFeeService } from './transaction-fee.service';
import { UpdateTransactionFeeDto } from './dto/update-transaction-fee.dto';

@Controller('transaction-fee')
export class TransactionFeeController {
  constructor(private readonly feeService: TransactionFeeService) {}

  // Get current transaction fee settings
  @Get()
  async getCurrentConfig() {
    return this.feeService.getCurrentConfig();
  }

  // Update transaction fee configuration
  @Patch()
  async updateConfig(@Body() dto: UpdateTransactionFeeDto) {
    return this.feeService.updateConfig(dto);
  }

  // Get transaction fee change history
  @Get('history')
  async getChangeHistory() {
    return this.feeService.getChangeHistory();
  }
}
