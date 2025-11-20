import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from 'src/business/entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async getAllWalletTransactions(): Promise<any[]> {
    const transactions = await this.transactionRepo.find({
      relations: ['sender', 'recipient'],
      order: { createdAt: 'DESC' },
    });

    const capitalize = (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return transactions.map((tx) => ({
      id: tx.id,

      user: tx.sender
        ? `${tx.sender.firstName || ''} ${tx.sender.surname || ''}`.trim()
        : 'System',

      sender: tx.sender
        ? `${tx.sender.firstName || ''} ${tx.sender.surname || ''}`.trim()
        : null,

      recipient: tx.recipient
        ? `${tx.recipient.firstName || ''} ${tx.recipient.surname || ''}`.trim()
        : null,

      type: capitalize(tx.type),
      amount: Number(tx.amount),
      description: tx.description,
      status: capitalize(tx.status),
      currency: tx.currency || null,
      service: tx.service || null,

      // Only return the enum value
      method: tx.method, // ← this is your PaymentMethod enum

      referenceId: tx.referenceId || null,

      date: tx.createdAt.toISOString().split('T')[0],
      time: tx.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));
  }
}
