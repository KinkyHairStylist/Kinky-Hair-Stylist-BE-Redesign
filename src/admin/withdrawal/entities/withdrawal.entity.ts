import { Business } from 'src/business/entities/business.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.withdrawals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountHolderName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  bankDetails: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'Pending' })
  status: 'Pending' | 'Processing' | 'Completed' | 'Rejected';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ nullable: true })
  requestDate: string;

  @Column({ nullable: true })
  timeAgo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
