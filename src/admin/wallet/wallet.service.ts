import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payment/entities/payment.entity';
import { Withdrawal } from '../withdrawal/entities/withdrawal.entity';
import { GiftCard } from '../giftcard/entities/giftcard.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(GiftCard)
    private readonly giftCardRepo: Repository<GiftCard>,
  ) {}

  async getAllWalletTransactions(): Promise<any[]> {
    const payments = await this.paymentRepo.find();
    const withdrawals = await this.withdrawalRepo.find();
    const giftCards = await this.giftCardRepo.find();

    const capitalize = (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const paymentTx = payments.map((p) => ({
      id: p.id,
      user: p.client,
      type: capitalize(p.refundType ? 'Refund' : p.fee ? 'Fee' : 'Earning'),
      amount: Number(p.amount),
      description: p.refundType
        ? `Refund to ${p.client}`
        : p.fee
        ? `Fee charged for ${p.business}`
        : `Payment from ${p.client}`,
      status: capitalize(p.status),
      balance: 0,
      date: p.createdAt.toISOString().split('T')[0],
      time: p.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    const withdrawalTx = withdrawals.map((w) => ({
      id: w.id,
      user: w.businessName,
      type: 'Withdrawal',
      amount: Number(w.amount),
      description: `Withdrawal request by ${w.businessName}`,
      status: capitalize(w.status),
      balance: Number(w.currentBalance),
      date: w.createdAt.toISOString().split('T')[0],
      time: w.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    const giftCardTx = giftCards.map((g) => ({
      id: g.id,
      user: g.purchaser.name,
      type: 'Earning',
      amount: Number(g.originalValue),
      description: `Gift card purchased for ${g.recipient.name}`,
      status: capitalize(g.status),
      balance: Number(g.currentBalance),
      date: g.createdAt.toISOString().split('T')[0],
      time: g.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    return [...paymentTx, ...withdrawalTx, ...giftCardTx];
  }
}
