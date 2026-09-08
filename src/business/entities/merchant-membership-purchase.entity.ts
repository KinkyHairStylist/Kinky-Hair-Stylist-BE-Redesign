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
import { MerchantMembershipPackage } from './merchant-membership-package.entity';
import { User } from 'src/all_user_entities/user.entity';

export enum MerchantMembershipPurchaseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FULLY_REDEEMED = 'FULLY_REDEEMED',
}

@Entity('merchant_membership_purchases')
export class MerchantMembershipPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  packageId: string;

  @ManyToOne(() => MerchantMembershipPackage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'packageId' })
  package: MerchantMembershipPackage;

  // denormalized for quick business-scoped queries, same convention as
  // StripePaymentIntent / BusinessGiftCard
  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @Column({ type: 'uuid' })
  @Index()
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'int' })
  remainingSessions: number;

  // Stripe PaymentIntent id that paid for this purchase — lets
  // completeMembershipPurchase() be idempotent (FE retry / duplicate call).
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  stripePaymentIntentId?: string | null;

  @Column({ type: 'timestamp with time zone' })
  purchasedAt: Date;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: MerchantMembershipPurchaseStatus,
    default: MerchantMembershipPurchaseStatus.ACTIVE,
  })
  status: MerchantMembershipPurchaseStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
