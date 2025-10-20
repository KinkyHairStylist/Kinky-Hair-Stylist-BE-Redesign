import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum GiftCardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  USED = 'used',
}

@Entity('giftcards')
export class GiftCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'jsonb' })
  purchaser: {
    name: string;
    email: string;
  };

  @Column({ type: 'jsonb' })
  recipient: {
    name: string;
    email: string;
  };

  @Column()
  business: string;

  @Column({ type: 'float' })
  originalValue: number;

  @Column({ type: 'float' })
  currentBalance: number;

  @Column({
    type: 'enum',
    enum: GiftCardStatus,
    default: GiftCardStatus.ACTIVE,
  })
  status: GiftCardStatus;

  @Column({ nullable: true })
expiryDate: string;

  @Column({ type: 'date' })
  purchaseDate: string;

  @Column({ type: 'date', nullable: true })
  lastUsedDate?: string;

  @CreateDateColumn()
  createdAt: Date;
}
