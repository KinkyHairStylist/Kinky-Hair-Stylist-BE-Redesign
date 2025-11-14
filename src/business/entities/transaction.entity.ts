import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { WalletCurrency } from 'src/admin/payment/enums/wallet.enum';

// Transaction Entity (referenced by Wallet)
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['credit', 'debit'] })
  type: 'credit' | 'debit';

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName: string;

  @Column({ type: 'enum', enum: WalletCurrency, nullable: true })
  currency: WalletCurrency;

  @Column({ type: 'varchar', length: 255, nullable: true })
  service: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'cancelled'],
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;
}
