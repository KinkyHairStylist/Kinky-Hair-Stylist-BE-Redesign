import { Column, CreateDateColumn, Entity, ManyToOne, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { GiftCardStatus } from '../enum/gift-card-status.enum';
import { GiftCardTemplate } from './gift-card-template.entity';

@Entity({ name: 'gift_cards' })
export class GiftCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column( {type: 'decimal', precision: 10, scale: 2})
  initialAmount: number;

  @Column({type: 'decimal', precision: 10, scale: 2})
  currentBalance: number

  @Column({
    type: 'enum',
    enum: GiftCardStatus,
    default: GiftCardStatus.ACTIVE
  })
  status: GiftCardStatus;

  @Column({nullable: true})
  recipientName: string

  @Column({nullable: true})
  recipientEmail: string

  @Column({nullable: true})
  senderName: string

  @Column({type: 'text', nullable: true})
  personalMessage: string

  @Column({type: 'timestamp', nullable: true})
  expiryDate: Date

  @Column({type: 'timestamp', nullable: true})
  usedAt: Date

  // @ManyToOne(() => User, {nullable: true})
  // recipientUser: User,

  // @ManyToOne(() => User, {nullable: true})
  // purchasedBy: User,

  @ManyToOne(() => GiftCardTemplate, {nullable: true})
  template: GiftCardTemplate;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isExpired(): boolean {
    return this.expiryDate && new Date() > this.expiryDate
  }

  canBeUsed(): boolean {
    return this.status === GiftCardStatus.ACTIVE && this.currentBalance > 0 && !this.isExpired()
  }
}
