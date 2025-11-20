import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from "src/all_user_entities/user.entity";
import { WalletCurrency } from 'src/admin/payment/enums/wallet.enum';

export enum TransactionType {
  EARNING = 'Earning',
  WITHDRAWAL = 'Withdrawal',
  DEBIT = 'Debit',
  FEE = 'Fee',
  REFUND = 'Refund',
}

export enum PaymentMethod {
  CARD = 'Card',
  PAYSTACK = 'Paystack',
  PAYPAL = 'PayPal',
  GIFTCARD = 'GiftCard',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --------------------------
  // Sender
  // --------------------------
  @Column({ type: 'uuid', nullable: true })
  senderId: string;

  @ManyToOne(() => User, (user) => user.sentTransactions, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  // --------------------------
  // Recipient
  // --------------------------
  @Column({ type: 'uuid', nullable: true })
  recipientId: string;

  @ManyToOne(() => User, (user) => user.receivedTransactions, { nullable: true })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

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

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  method: PaymentMethod;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
