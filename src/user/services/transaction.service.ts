import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from 'src/business/entities/transaction.entity';
import { User } from 'src/all_user_entities/user.entity';
import { Refund, RefundStatus } from '../user_entities/refund.entity';

export interface TransactionSummary {
  totalSpent: number;
  successfulPaymentsCount: number;
  totalRefundAmount: number;
  currentYear: number
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
  ) {}

  async getUserTransactions(user: User): Promise<Transaction[]> {
    // Get transactions where user is either sender or recipient
    return this.transactionRepository.find({
      where: [
        { senderId: user.id },
        { recipientId: user.id },
      ],
      order: { createdAt: 'DESC' },
      relations: ['sender', 'recipient'],
    });
  }

  async getUserTransactionSummary(user: User, year?: number): Promise<TransactionSummary> {
    const currentYear = year || new Date().getFullYear();

    // Get transactions for the current year where user is sender (spending transactions)
    const spendTransactions = await this.transactionRepository.find({
      where: {
        senderId: user.id,
      },
    });

    // Calculate total spent (successful DEBIT transactions)
    const totalSpent = spendTransactions
      .filter(t => t.status === TransactionStatus.COMPLETED && t.type === TransactionType.DEBIT)
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Count successful payments
    const successfulPaymentsCount = spendTransactions
      .filter(t => t.status === TransactionStatus.COMPLETED && t.type === TransactionType.DEBIT)
      .length;

    // Calculate total refund amount (REFUND transactions received by user)
    const refundTransactions = await this.transactionRepository.find({
      where: {
        recipientId: user.id,
        type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(`${currentYear}-01-01`) as any,
      },
    });

    const totalRefundAmount = refundTransactions
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      totalSpent,
      successfulPaymentsCount,
      totalRefundAmount,
      currentYear,
    };
  }

  async requestRefund(user: User, transactionId: string, reason: string, accountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    routingNumber?: string;
    bankAddress?: string;
    swiftCode?: string;
  }): Promise<{ success: boolean; message: string }> {
    // Find the transaction
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['sender', 'recipient'],
    });

    if (!transaction) {
      return { success: false, message: 'Transaction not found' };
    }

    // Check if user is the sender (who made the payment)
    if (transaction.senderId !== user.id) {
      return { success: false, message: 'You can only request refunds for transactions you initiated' };
    }

    // Check if transaction is eligible for refund (completed and within refund period - e.g., 30 days)
    if (transaction.status !== TransactionStatus.COMPLETED) {
      return { success: false, message: 'Only completed transactions can be refunded' };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (transaction.createdAt < thirtyDaysAgo) {
      return { success: false, message: 'Refund period has expired (30 days)' };
    }

    // Check if refund already requested
    const existingRefund = await this.refundRepository.findOne({
      where: {
        transactionId: transactionId,
        userId: user.id,
      },
    });

    if (existingRefund && existingRefund.status !== RefundStatus.REJECTED) {
      return { success: false, message: 'Refund already requested for this transaction' };
    }

    // Create refund record
    const refund = this.refundRepository.create({
      transactionId: transactionId,
      userId: user.id,
      amount: parseFloat(transaction.amount.toString()),
      currency: transaction.currency,
      reason,
      status: RefundStatus.PENDING,
      bankName: accountDetails?.bankName,
      accountNumber: accountDetails?.accountNumber,
      accountHolderName: accountDetails?.accountHolderName,
      routingNumber: accountDetails?.routingNumber,
      bankAddress: accountDetails?.bankAddress,
      swiftCode: accountDetails?.swiftCode,
    });

    await this.refundRepository.save(refund);

    return { success: true, message: 'Refund request submitted successfully' };
  }
}
