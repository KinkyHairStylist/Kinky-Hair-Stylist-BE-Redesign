import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Wallet } from '../entities/wallet.entity';
import { SlackService } from 'src/services/slack.service';
import {
  SlackEventType,
  SlackNode,
  SlackProvider,
  SlackSeverity,
} from '../../utils/enum';

// Moves matured Stripe-sourced booking earnings from pendingBalance to
// balance once their 48h payout hold has passed — see
// BusinessWalletService.addFundsPending / Wallet.pendingBalance for why
// the hold exists (recovering a lost chargeback from money never handed
// out, instead of clawing back an already-released balance).
@Injectable()
export class WalletReleaseCronService {
  private readonly logger = new Logger(WalletReleaseCronService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySweep(): Promise<void> {
    const matured = await this.transactionRepo.find({
      where: {
        type: TransactionType.EARNING,
        availableAt: LessThanOrEqual(new Date()),
      },
    });
    // TypeORM's LessThanOrEqual on a nullable column already excludes
    // NULL rows at the SQL level (NULL <= anything is unknown, not true),
    // but this is the field's whole reason for existing — filter
    // explicitly for clarity rather than relying on that implicitly.
    const toRelease = matured.filter((t) => t.availableAt !== null);

    for (const txn of toRelease) {
      try {
        const wallet = await this.walletRepo.findOne({ where: { id: txn.walletId } });
        if (!wallet) {
          this.logger.warn(`Wallet ${txn.walletId} not found for matured transaction ${txn.id} — skipping`);
          continue;
        }

        wallet.pendingBalance = Number(wallet.pendingBalance) - Number(txn.amount);
        wallet.balance = Number(wallet.balance) + Number(txn.amount);
        await this.walletRepo.save(wallet);

        // Nulling this out is what marks the transaction as released —
        // also prevents this same row from being picked up again next run.
        txn.availableAt = null;
        await this.transactionRepo.save(txn);
      } catch (error) {
        this.logger.error(
          `Failed to release matured transaction ${txn.id}: ${error.message}`,
          error.stack,
        );
        // No automatic retry exists for a matured transaction that fails
        // to release — it can sit in pendingBalance indefinitely with
        // nobody alerted.
        SlackService.notify({
          node: SlackNode.PAYMENT,
          provider: SlackProvider.SYSTEM,
          severity: SlackSeverity.ERROR,
          type: SlackEventType.ERROR_ALERT,
          trigger: `Wallet release failed for transaction ${txn.id}`,
          body: `A matured Stripe earning failed to release from pendingBalance to balance.
• Wallet: ${txn.walletId}
• Amount: $${txn.amount}
• Error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  }
}
