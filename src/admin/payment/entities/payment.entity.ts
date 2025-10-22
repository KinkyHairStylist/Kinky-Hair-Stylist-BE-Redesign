import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TransactionStatus = 'pending' | 'successful' | 'failed' | 'refunded' | 'disputed';
export type PaymentMethod = 'paypal'; // ✅ Only PayPal now

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  client: string; // customer name

  @Column()
  business: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  method: PaymentMethod; // ✅ Now only 'paypal'

  @Column({ default: 'pending' })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee?: number;

  @Column({ nullable: true })
  refundType?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  gatewayTransactionId?: string; // PayPal transaction ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
