import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentModeType } from '../enums/wallet.enum';

export type TransactionStatus =
  | 'pending'
  | 'successful'
  | 'failed'
  | 'refunded'
  | 'disputed';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  client: string; // customer name

  @Column()
  businessId: string;

  @Column()
  business: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentModeType, nullable: true })
  method: PaymentModeType;

  @Column({ default: 'pending' })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee?: number;

  @Column({ nullable: true })
  refundType?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  gatewayTransactionId: string;

  @Column({ nullable: true })
  appointmentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
