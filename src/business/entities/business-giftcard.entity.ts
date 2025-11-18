import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  BusinessGiftCardStatus,
  BusinessGiftCardTemplate,
  BusinessSentStatus,
} from '../enum/gift-card.enum';
import { Business } from './business.entity';

@Entity('business_gift_cards')
export class BusinessGiftCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.giftCards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ type: 'simple-array' })
  benefits: string[];

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: BusinessGiftCardTemplate })
  template: BusinessGiftCardTemplate;

  @Column({ type: 'int', default: 365 })
  expiryInDays: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date;

  @Column({
    type: 'enum',
    enum: BusinessGiftCardStatus,
    default: BusinessGiftCardStatus.AVAILABLE,
  })
  status: BusinessGiftCardStatus;

  @Column({
    type: 'enum',
    enum: BusinessSentStatus,
    default: BusinessSentStatus.SENT,
  })
  sentStatus: BusinessSentStatus;

  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ type: 'varchar', length: 255 })
  recipientEmail: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true, default: 'AUD' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  senderName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
