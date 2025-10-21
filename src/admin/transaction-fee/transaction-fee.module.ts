import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionFeeConfig } from './entities/transaction-fee.entity';
import { TransactionFeeService } from './transaction-fee.service';
import { TransactionFeeController } from './transaction-fee.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionFeeConfig])], 
  controllers: [TransactionFeeController],
  providers: [TransactionFeeService],
})
export class TransactionFeeModule {}
